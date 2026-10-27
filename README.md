# OmniGene

**OmniGene** is a high-performance interactive spatial transcriptomics browser designed to visualise single-cell spatial coordinates, gene expression heatmaps, and multi-gene overlays directly in your browser.

🔗 **Live Demo:** [https://omnigene-psi.vercel.app](https://omnigene-psi.vercel.app)

---

## Features

* **Interactive Canvas:** High-speed WebGL rendering for thousands of single cells with adjustable point size and opacity thresholds.
* **Multi-Format Support:** Load `.h5ad` (AnnData), `.loom`, `.parquet`, or tabular CSV/TSV spatial datasets.
* **Gene Expression & Annotations:** Search genes dynamically, switch colour palettes, and explore cellular annotations.
* **Chunked Upload Pipeline:** Out-of-order chunked file uploading with random-access offset writing (`f.seek()`) for large spatial datasets.

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
