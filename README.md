# OmniGene

**OmniGene** is a lightweight, interactive spatial transcriptomics browser for the first look at your data. Visualise spatial coordinates, view gene expression, compare genes side by side, and overlay up to four colour-coded genes on the same tissue section, directly in your browser. No code and no installation needed.

🔗 **Live Demo:** [https://omnigene-psi.vercel.app](https://omnigene-psi.vercel.app)

---

## Features

* **Interactive Canvas:** Fast canvas rendering for thousands of cells or spots, with zoom, pan, and adjustable point size and expression thresholds.
* **Multi-Gene Overlay:** Assign up to four genes to four colour channels (red, green, blue, yellow) and see them together on one tissue section, with saturation and threshold controls.
* **Tissue / UMAP Toggle:** Switch any view between the tissue layout and a UMAP of the same cells or spots, in Explore, Compare and Overlay, with the same gene and cell-type colouring. The toggle appears when your file already contains a UMAP.
* **Gene Comparison:** View several genes side by side.
* **PNG Export:** Export the current view as a figure-ready PNG for presentations, theses, and papers.
* **Multi-Format Support:** Load `.h5ad` (AnnData), `.loom`, `.parquet`, or tabular CSV/TSV spatial datasets.
* **Gene Expression & Annotations:** Search genes dynamically, switch colour palettes, and colour the tissue by cell type or other annotations.
* **Chunked Upload Pipeline:** Out-of-order chunked file uploading with random-access offset writing (`f.seek()`) for large spatial datasets.

---

## What OmniGene Is For (and What It Isn't)

OmniGene is built for **initial, visual exploration**: seeing where genes of interest sit in the tissue before you run advanced analysis, or checking that the marker genes for a cluster appear where you expect. It complements tools like Seurat, Scanpy and Squidpy; it does not replace them.

Things to keep in mind:

* **Visual, not statistical.** There are no significance tests, and overlays depend on normalisation and on where you set the threshold. Genes appearing in the same place is a clue, not a conclusion.
* **Spots are not always single cells.** In Visium-style data, each spot contains several cells, so two genes overlapping in a spot does not show they are in the same cell.
* **UMAP is display-only.** OmniGene shows a UMAP only if your file already contains one (stored as `X_umap`). It doesn't compute one, and selecting points on the UMAP doesn't yet highlight them on the tissue.

---

## Try It with Example Data

A public Visium dataset is available on Zenodo: [Processed data on Zenodo](https://doi.org/10.5281/zenodo.6578047). Download `Visium_control_P1.h5ad` and upload it to the [live demo](https://omnigene-psi.vercel.app), then try the **Overlay** tab.

---

## Tech Stack

Python, FastAPI, React, Vite, PyArrow, AnnData, NumPy, Pandas, and SciPy.

---

## Running the Application

### 1. Clone the Repository

```bash
git clone https://github.com/enahoro-dev/omnigene.git
cd omnigene
```

### 2. Working with Large Files (> 200 MB): Optional

The standard version of OmniGene limits uploads to **200 MB** so the hosted demo stays fast and stable. If your dataset is larger than that, use the **large-file version** included in this repository: **`omnigene-large-files.zip`**. It contains a modified `main.py` and `frontend` folder with the upload limit removed, so there are no size limits or size-related error messages in either the backend or the frontend.

> If your files are under 200 MB, skip this step and go straight to step 3.

**Setup (do this before running the servers):**

1. Unzip `omnigene-large-files.zip`. You will get a `main.py` file and a `frontend` folder.
2. Copy the unzipped `main.py` into `backend/`, overwriting the existing `backend/main.py`.
3. Delete the existing `frontend` folder in the repository root and put the unzipped `frontend` folder in its place.

```bash
# from the repository root (macOS / Linux)
unzip omnigene-large-files.zip -d large-files-tmp
cp large-files-tmp/main.py backend/main.py
rm -rf frontend
cp -r large-files-tmp/frontend ./frontend
rm -rf large-files-tmp
```

Then continue with steps 3 to 5 below as normal.

**Good to know:** the app holds the whole dataset in memory, so the practical limit becomes your computer's RAM. As a rule of thumb, have free memory of at least 2-3x the file size. Very large uploads can take a few minutes to upload and load.

### 3. Configure Local Environment

```bash
cd frontend
echo "VITE_API_URL=http://localhost:7860" > .env
cd ..
```

### 4. Set Up and Run the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
