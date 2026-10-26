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
git clone [https://github.com/enahoro-dev/omnigene.git](https://github.com/enahoro-dev/omnigene.git)
cd omnigene
```
### 2.Configure Local Environment
```bash
cd frontend
echo "VITE_API_URL=http://localhost:7860" > .env
cd ..
```
### 3. Set Up and Run the Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
