import gzip
import io
import json
import os
import struct
import tempfile
import threading
import time
import traceback
import uuid
from collections import OrderedDict
from typing import Optional

import anndata as ad
import numpy as np
import pandas as pd
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from scipy.sparse import csr_matrix, issparse

app = FastAPI(title="OMNIGENE API")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "200"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
CHUNK_BYTES = 4 * 1024 * 1024  # Reverted back to 4MB for optimal client-side chunk rhythm
MAX_SESSIONS = int(os.getenv("MAX_SESSIONS", "3"))
SESSION_TTL = int(os.getenv("SESSION_TTL_MINUTES", "120")) * 60
MAX_GENES = 10
H5AD_FILE_PATH = os.getenv("H5AD_FILE_PATH", "sample_spatial.h5ad")

TABLE_EXTS = {".csv", ".tsv", ".txt"}
BINARY_EXTS = {".h5ad", ".loom", ".parquet"}
FORMATS_LABEL = ".h5ad, .loom, .csv, .tsv, .txt (optionally .gz) or .parquet"

OBSM_SPATIAL = [
    "spatial", "X_spatial", "spatial_coords", "X_spatial_coords",
    "spatial_xy", "xy", "X_xy", "coords", "X_coords",
]
OBS_PAIRS = [
    ("x", "y"), ("x_coord", "y_coord"), ("x_coordinate", "y_coordinate"),
    ("x_centroid", "y_centroid"), ("centroid_x", "centroid_y"),
    ("center_x", "center_y"), ("x_um", "y_um"), ("x_global_px", "y_global_px"),
    ("centerx_global_px", "centery_global_px"),
    ("spatial_x", "spatial_y"), ("global_x", "global_y"),
    ("imagecol", "imagerow"), ("pxl_col_in_fullres", "pxl_row_in_fullres"),
    ("array_col", "array_row"), ("x_pixel", "y_pixel"), ("col", "row"),
]
EMBEDDINGS = ["X_umap", "X_tsne", "X_pca", "X_draw_graph_fa", "X_diffmap"]
SYMBOL_COLUMNS = [
    "gene_symbols", "gene_symbol", "symbol", "gene_name", "gene_names",
    "feature_name", "SYMBOL", "Gene", "gene",
]
SECTION_COLUMNS = ["library_id", "sample_id", "sample", "section", "slice", "batch", "fov"]
ID_NAMES = {"", "cell_id", "cellid", "cell", "barcode", "barcodes", "id", "index", "cell_name"}
META_COLUMNS = ID_NAMES | {
    "fov", "fov_name", "label", "cluster", "clusters", "leiden", "louvain", "cell_type",
    "celltype", "annotation", "z", "z_um", "z_global_px", "area", "volume", "nucleus_area",
    "cell_area", "total_counts", "n_counts", "n_genes", "n_genes_by_counts",
    "transcript_counts", "control_probe_counts", "sample", "batch", "slice", "section",
    "min_x", "max_x", "min_y", "max_y",
}


def human_size(n):
    return f"{n / 1024**3:.1f} GB" if n >= 1024**3 else f"{n / 1024**2:.0f} MB"


def too_large_message(size=None):
    limit = f"{MAX_UPLOAD_MB // 1024} GB" if MAX_UPLOAD_MB % 1024 == 0 else f"{MAX_UPLOAD_MB} MB"
    lead = f"That file is {human_size(size)}. " if size else "That file is too large. "
    return f"{lead}The upload limit is {limit}."


def _xy(value):
    try:
        arr = value.to_numpy() if hasattr(value, "to_numpy") else np.asarray(value)
        if arr.ndim != 2 or arr.shape[1] < 2:
            return None
        arr = arr[:, :2].astype(np.float64)
    except (ValueError, TypeError):
        return None
    return arr if np.isfinite(arr).all(axis=1).any() else None


def find_coordinates(a):
    obsm_keys = list(a.obsm.keys())
    lower = {k.lower(): k for k in obsm_keys}

    def result(xy, source, label, is_spatial, note=None):
        return xy, {"source": source, "label": label, "is_spatial": is_spatial, "note": note}

    for name in OBSM_SPATIAL:
        key = lower.get(name.lower())
        if key is not None:
            xy = _xy(a.obsm[key])
            if xy is not None:
                return result(xy, f"obsm['{key}']", key, True)

    for key in obsm_keys:
        if any(t in key.lower() for t in ("spatial", "coord", "xy")):
            xy = _xy(a.obsm[key])
            if xy is not None:
                return result(xy, f"obsm['{key}']", key, True)

    cols = {c.lower(): c for c in a.obs.columns}
    for xn, yn in OBS_PAIRS:
        if xn in cols and yn in cols:
            xs = pd.to_numeric(a.obs[cols[xn]], errors="coerce").to_numpy()
            ys = pd.to_numeric(a.obs[cols[yn]], errors="coerce").to_numpy()
            xy = np.column_stack([xs, ys]).astype(np.float64)
            if np.isfinite(xy).all(axis=1).any():
                label = f"{cols[xn]}/{cols[yn]}"
                return result(xy, f"obs['{cols[xn]}'], obs['{cols[yn]}']", label, True)

    for key in EMBEDDINGS + [k for k in obsm_keys if k not in EMBEDDINGS]:
        if key in obsm_keys:
            xy = _xy(a.obsm[key])
            if xy is not None:
                label = key[2:].upper() if key.startswith("X_") else key
                note = (
                    f"No spatial coordinates were found, so cells are placed using "
                    f"'{key}'. This is an embedding, not tissue positions."
                )
                return result(xy, f"obsm['{key}']", label, False, note)

    raise ValueError(
        "Couldn't find cell coordinates. "
        f"obsm keys: {obsm_keys or 'none'}. "
        f"obs columns: {list(a.obs.columns)[:20] or 'none'}. "
        "Add adata.obsm['spatial'] (cells x 2) and save the file again."
    )


def find_umap(a):
    for key in a.obsm.keys():
        if key.lower() in ("x_umap", "umap"):
            xy = _xy(a.obsm[key])
            if xy is not None:
                return xy
    return None


def use_gene_symbols(a):
    names = a.var_names.astype(str)
    if len(names) and (names.str.startswith("ENS").mean() > 0.5):
        for col in SYMBOL_COLUMNS:
            if col in a.var.columns:
                a.var_names = a.var[col].astype(str).values
                break
    a.var_names_make_unique()


def extract_image(a):
    try:
        from PIL import Image

        spatial = a.uns.get("spatial")
        if not isinstance(spatial, dict) or len(spatial) != 1:
            return None
        lib = next(iter(spatial.values()))
        images = lib["images"]
        key = "hires" if "hires" in images else "lowres"
        arr = np.asarray(images[key])
        scale = float(lib["scalefactors"][f"tissue_{key}_scalef"])
        if arr.dtype != np.uint8:
            arr = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
        buf = io.BytesIO()
        Image.fromarray(arr[..., :3]).save(buf, "JPEG", quality=85)
        return {"bytes": buf.getvalue(), "width": int(arr.shape[1]), "height": int(arr.shape[0]), "scale": scale}
    except Exception:
        return None


def find_sections(a):
    cols = {c.lower(): c for c in a.obs.columns}
    for name in SECTION_COLUMNS:
        col = cols.get(name)
        if col is None:
            continue
        cat = a.obs[col].astype("category")
        values = [str(v) for v in cat.cat.categories]
        if 2 <= len(values) <= 30:
            return {"column": str(col), "values": values, "codes": cat.cat.codes.to_numpy().astype(np.int16)}
    return None


def find_annotations(a):
    names = []
    sample_n = min(10000, len(a.obs))
    obs_sample = a.obs.iloc[:sample_n] if len(a.obs) > sample_n else a.obs
    for col in a.obs.columns:
        series = obs_sample[col]
        if pd.api.types.is_float_dtype(series):
            continue
        if 2 <= series.nunique(dropna=True) <= 60:
            names.append(str(col))
    return names


def column_matrix(X):
    if issparse(X):
        return X.tocsr().astype(np.float32)
    return np.asarray(X, dtype=np.float32)


class Dataset:
    def __init__(self, a, xy, info):
        self.info = info
        self.xy = xy
        # keep the UMAP only when the main layout is real tissue coordinates
        self.umap = find_umap(a) if info.get("is_spatial") else None
        self.valid = np.isfinite(xy).all(axis=1)
        self.image = extract_image(a)
        self.sections = find_sections(a)
        self.annotations = find_annotations(a)
        self.var_names = a.var_names
        self.obs = a.obs[self.annotations].copy()
        self.X = column_matrix(a.X)

    def summary(self):
        return {
            "loaded": True,
            "cells": int(self.valid.sum()),
            "genes": int(self.X.shape[1]),
            "has_umap": self.umap is not None,
            **self.info,
            "annotations": self.annotations,
            "sections": {"column": self.sections["column"], "values": self.sections["values"]} if self.sections else None,
            "image": {k: self.image[k] for k in ("width", "height", "scale")} if self.image else None,
        }

    def mask(self, section):
        if section and self.sections:
            values = self.sections["values"]
            if section not in values:
                raise HTTPException(status_code=404, detail=f"Section '{section}' not found")
            return self.valid & (self.sections["codes"] == values.index(section))
        return self.valid

    def gene(self, name):
        names = self.var_names
        if name not in names:
            match = [g for g in names if g.upper() == name.upper()]
            if not match:
                raise HTTPException(status_code=404, detail=f"Gene '{name}' not found in dataset")
            name = match[0]
        col = self.X[:, names.get_loc(name)]
        if issparse(col):
            col = col.toarray()
        return name, np.asarray(col, dtype=np.float32).ravel()

    def annotation(self, name, section):
        if name not in self.annotations:
            raise HTTPException(status_code=404, detail=f"Annotation '{name}' not found")
        series = self.obs[name].astype("category")
        codes = series.cat.codes.to_numpy()[self.mask(section)]
        return {
            "name": name,
            "categories": [str(c) for c in series.cat.categories],
            "codes": codes.tolist(),
        }


def build_dataset(a):
    xy, info = find_coordinates(a)
    use_gene_symbols(a)
    return Dataset(a, xy, info)


default_ds = None
sessions = OrderedDict()
uploads = {}
lock = threading.Lock()


def session_id(x_session_id: str = Header(default="anon")):
    return x_session_id[:64]


def purge_sessions():
    now = time.time()
    for sid in [s for s, (_, t) in sessions.items() if now - t > SESSION_TTL]:
        del sessions[sid]


def get_ds(sid):
    with lock:
        purge_sessions()
        if sid in sessions:
            sessions[sid][1] = time.time()
            sessions.move_to_end(sid)
            return sessions[sid][0]
    return default_ds


def require_ds(sid):
    ds = get_ds(sid)
    if ds is None:
        raise HTTPException(status_code=409, detail="No dataset loaded. Upload a dataset first.")
    return ds


def put_ds(sid, ds):
    with lock:
        sessions[sid] = [ds, time.time()]
        sessions.move_to_end(sid)
        purge_sessions()
        while len(sessions) > MAX_SESSIONS:
            sessions.popitem(last=False)


def classify(filename):
    name = (filename or "").lower()
    gz = name.endswith(".gz")
    base = name[:-3] if gz else name
    ext = os.path.splitext(base)[1]
    if ext == ".h5":
        raise HTTPException(
            status_code=400,
            detail="10x .h5 matrices contain no cell positions. Upload an .h5ad with "
                   "spatial coordinates, or a table with x and y columns.",
        )
    if ext in TABLE_EXTS or (not gz and ext in BINARY_EXTS):
        return ext, gz
    raise HTTPException(status_code=400, detail=f"Unsupported file type. Use {FORMATS_LABEL}.")


def table_to_parts(df):
    first = df.columns[0]
    first_name = str(first).strip().lower()
    if (not pd.api.types.is_numeric_dtype(df[first])) or first_name.startswith("unnamed") or first_name in ID_NAMES:
        df = df.set_index(first)

    cols = {str(c).strip().lower(): c for c in df.columns}
    pair = next(((cols[a], cols[b]) for a, b in OBS_PAIRS if a in cols and b in cols), None)
    if pair is None:
        raise ValueError(
            "Couldn't find x/y coordinate columns in this table. "
            f"Columns found: {[str(c) for c in df.columns][:20]}. "
            "Name them x and y (or x_centroid/y_centroid, center_x/center_y, ...). "
            "Tables need one row per cell and one column per gene."
        )
    xc, yc = pair
    skip = {xc, yc} | {c for c in df.columns if str(c).strip().lower() in META_COLUMNS}
    genes = [c for c in df.columns if c not in skip and pd.api.types.is_numeric_dtype(df[c])]
    if not genes:
        raise ValueError("No numeric gene columns found. Tables need one row per cell and one column per gene.")

    xy = np.column_stack(
        [pd.to_numeric(df[xc], errors="coerce"), pd.to_numeric(df[yc], errors="coerce")]
    ).astype(np.float64)
    X = csr_matrix(np.nan_to_num(df[genes].to_numpy(dtype=np.float32)))
    return X, df.drop(columns=genes), [str(g) for g in genes], xy


def table_to_adata(df):
    X, obs, genes, xy = table_to_parts(df)
    obs.index = obs.index.astype(str)
    obs.columns = obs.columns.astype(str)
    a = ad.AnnData(X=X, obs=obs, var=pd.DataFrame(index=genes))
    a.obsm["spatial"] = xy
    return a


def read_text_table(path, gz):
    opener = gzip.open if gz else open
    with opener(path, "rt", errors="replace") as f:
        first = f.readline()
    sep = "	" if "	" in first else (";" if first.count(";") > first.count(",") else ",")
    try:
        return pd.read_csv(path, sep=sep, engine="pyarrow")
    except Exception:
        return pd.read_csv(path, sep=sep, low_memory=False)


def read_dataset_file(path, ext, gz):
    if ext == ".h5ad":
        return ad.read_h5ad(path)
    if ext == ".loom":
        reader = getattr(ad, "read_loom", None) or getattr(getattr(ad, "io", None), "read_loom", None)
        if reader is None:
            raise ValueError("This version of anndata can't read .loom files.")
        return reader(path)
    if ext == ".parquet":
        return table_to_adata(pd.read_parquet(path))
    return table_to_adata(read_text_table(path, gz))


def load_dataset_file(path, ext, gz):
    try:
        t0 = time.time()
        a = read_dataset_file(path, ext, gz)
        t1 = time.time()
        ds = build_dataset(a)
        print(f"loaded {ext}: read {t1 - t0:.1f}s, build {time.time() - t1:.1f}s", flush=True)
        return ds
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MemoryError:
        raise HTTPException(status_code=507, detail="The server ran out of memory loading this file.")
    except ImportError as e:
        raise HTTPException(status_code=400, detail=f"Reading this format needs an extra package: {e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Could not read file ({type(e).__name__}): {e}")


@app.on_event("startup")
def startup():
    global default_ds
    if os.path.exists(H5AD_FILE_PATH):
        try:
            default_ds = build_dataset(ad.read_h5ad(H5AD_FILE_PATH))
            print(f"Default dataset: {default_ds.X.shape[0]} cells, {default_ds.X.shape[1]} genes")
        except Exception as e:
            print(f"Could not load {H5AD_FILE_PATH}: {e}")


@app.get("/")
def health_check():
    return {"status": "online"}


@app.get("/api/dataset-info")
def dataset_info(sid: str = Depends(session_id)):
    ds = get_ds(sid)
    return {"max_upload_mb": MAX_UPLOAD_MB, **(ds.summary() if ds else {"loaded": False})}


@app.get("/api/genes")
def get_gene_list(sid: str = Depends(session_id)):
    ds = get_ds(sid)
    return {"genes": list(ds.var_names) if ds else []}


@app.get("/api/image")
def get_image(sid: str = Depends(session_id)):
    ds = require_ds(sid)
    if not ds.image:
        raise HTTPException(status_code=404, detail="This dataset has no tissue image")
    return Response(ds.image["bytes"], media_type="image/jpeg")


@app.get("/api/annotation")
def get_annotation(name: str, section: Optional[str] = None, sid: str = Depends(session_id)):
    return require_ds(sid).annotation(name, section)


def encode_batch(meta, x, y, arrays):
    head = json.dumps(meta).encode()
    pad = (-len(head)) % 4
    parts = [struct.pack("<I", len(head) + pad), head, b" " * pad, x.astype("<f4").tobytes(), y.astype("<f4").tobytes()]
    parts += [a.astype("<f4").tobytes() for a in arrays]
    return b"".join(parts)


@app.get("/api/spatial/batch")
def get_batch(genes: str = Query(""), section: Optional[str] = None, layout: str = "spatial", sid: str = Depends(session_id)):
    ds = require_ds(sid)
    if layout == "umap" and ds.umap is None:
        raise HTTPException(status_code=400, detail="This dataset has no UMAP.")
    xy = ds.umap if layout == "umap" else ds.xy
    names = [g.strip() for g in genes.split(",") if g.strip()]
    if len(names) > MAX_GENES:
        raise HTTPException(status_code=400, detail=f"Maximum of {MAX_GENES} genes per request")
    mask = ds.mask(section)
    n = int(mask.sum())
    if n == 0:
        raise HTTPException(status_code=400, detail="No cells with usable coordinates")

    arrays, gene_meta = [], []
    for name in names:
        symbol, vec = ds.gene(name)
        arr = np.nan_to_num(vec[mask], nan=0.0)
        arrays.append(arr)
        gene_meta.append({"name": symbol, "min": float(arr.min()), "max": float(arr.max())})

    meta = {"n": n, "genes": gene_meta, "coords_source": "umap" if layout == "umap" else ds.info.get("source")}
    body = encode_batch(meta, xy[mask, 0], xy[mask, 1], arrays)
    return Response(body, media_type="application/octet-stream")


class StartUpload(BaseModel):
    filename: str
    size: int


def cleanup_uploads():
    now = time.time()
    for uid in [u for u, up in uploads.items() if now - up["t"] > 3600]:
        try:
            os.remove(uploads.pop(uid)["path"])
        except OSError:
            pass


@app.post("/api/upload/start")
def upload_start(body: StartUpload, sid: str = Depends(session_id)):
    ext, gz = classify(body.filename)
    if body.size <= 0:
        raise HTTPException(status_code=400, detail="That file is empty.")
    if body.size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=too_large_message(body.size))
    cleanup_uploads()
    
    # Fast temp directory selection (uses RAM disk if mounted or standard temp dir)
    target_dir = "/home/omnigene/app/ramdisk" if os.path.exists("/home/omnigene/app/ramdisk") else None
    fd, path = tempfile.mkstemp(dir=target_dir, suffix=ext + (".gz" if gz else ""))
    os.close(fd)
    
    uid = uuid.uuid4().hex
    uploads[uid] = {
        "path": path,
        "ext": ext,
        "gz": gz,
        "size": body.size,
        "chunks": {},
        "t": time.time(),
    }
    return {"upload_id": uid, "chunk_bytes": CHUNK_BYTES}


def write_at(path, offset, data):
    with open(path, "r+b") as f:
        f.seek(offset)
        f.write(data)


@app.put("/api/upload/{uid}/chunk")
async def upload_chunk(uid: str, request: Request, offset: int = Query(...)):
    up = uploads.get(uid)
    if up is None:
        raise HTTPException(status_code=404, detail="Upload not found or expired")
    data = await request.body()
    
    if offset < 0 or len(data) > CHUNK_BYTES * 2 or offset + len(data) > up["size"]:
        raise HTTPException(status_code=413, detail=too_large_message())
        
    await run_in_threadpool(write_at, up["path"], offset, data)
    up["chunks"][offset] = len(data)
    up["t"] = time.time()
    return {"received": sum(up["chunks"].values())}


@app.post("/api/upload/{uid}/finish")
async def upload_finish(uid: str, sid: str = Depends(session_id)):
    up = uploads.pop(uid, None)
    if up is None:
        raise HTTPException(status_code=404, detail="Upload not found or expired")
    try:
        if sum(up["chunks"].values()) != up["size"]:
            raise HTTPException(status_code=400, detail="Upload incomplete. Please try again.")
            
        ds = await run_in_threadpool(load_dataset_file, up["path"], up["ext"], up["gz"])
    finally:
        if os.path.exists(up["path"]):
            os.remove(up["path"])
            
    put_ds(sid, ds)
    return ds.summary()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
