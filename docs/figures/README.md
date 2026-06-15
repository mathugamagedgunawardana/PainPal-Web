# Paper figures for Overleaf

## Built-in (no upload needed)

`PAINPAL_IEEE_PAPER.tex` includes **TikZ / pgfplots** diagrams that compile directly in Overleaf:

- System architecture (Fig. 1)
- ML pipeline (Fig. 2)
- Use case overview (Fig. 3)
- ER diagram (Fig. 4)
- Confusion matrix (Fig. 5)
- Per-class F1 bar chart (Fig. 6)

## Optional screenshots

To add real UI screenshots, place PNG/JPG files in this folder and uncomment the blocks marked `OPTIONAL SCREENSHOT` in the `.tex` file:

| File | Suggested content |
|------|-------------------|
| `mobile_app.png` | Flutter attack logging screen |
| `doctor_dashboard.png` | Next.js clinician dashboard |
| `mri_upload.png` | MRI upload / prediction UI |

Upload the `figures/` folder to your Overleaf project alongside `main.tex`.
