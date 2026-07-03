# Global Sustainable Energy Dashboard

An interactive data-visualisation dashboard exploring the world's progress toward
**UN Sustainable Development Goal 7 – Affordable & Clean Energy**, built with **D3.js**.

- **Course:** CDS6324 – Data Visualization
- **Lecture / Tutorial Section:** TC2L / TT6L
- **Group:** TT6L_G2

| Student ID | Name |
| :---: | :--- |
| 1221306781 | Eng Xin Yee |
| 1221101409 | Gracie Tan Tze Ling |
| 1221102916 | Tan Jie Ting |

---

## Overview

As countries adopt renewable energy and reduce their dependence on fossil fuels, the
global energy landscape is shifting. This dashboard lets users explore that transition
interactively — tracking the changing electricity-generation mix, comparing renewable-energy
development between countries, and examining how economic development relates to access to
sustainable energy.

The dashboard is organised around three analytical questions:

1. **How has the global electricity generation mix changed between 2000 and 2020?**
2. **Which countries have made the greatest progress in renewable energy development?**
3. **How does economic development influence access to sustainable energy across countries?**

---

## Dataset

**Global Data on Sustainable Energy (2000–2020)** — 3,649 records across 176 countries,
with 21 attributes covering electricity access, renewable energy, emissions, financial
flows, and economic indicators.

- **Source:** https://github.com/AnshTanwar/Global-Data-on-Sustainable-Energy
- **File:** `data/cleaned_sustainable_energy.csv` (cleaned / pre-processed)

Key attributes used include `year`, `renewable_energy_share_pct`,
`renewable_capacity_per_capita`, `electricity_fossil_twh`, `electricity_renewables_twh`,
`electricity_nuclear_twh`, `low_carbon_electricity_pct`, `access_electricity_pct`,
`clean_fuels_cooking_pct`, and `gdp_per_capita`.

---

## Visualisations

| # | Chart | What it shows |
| :--: | :--- | :--- |
| 1 | Stacked Area Chart | Global electricity generation mix (fossil / renewables / nuclear) over time |
| 2 | Line Chart | Trend of low-carbon electricity as a share of total generation |
| 3 | **Horizontal Bar Chart** | Top countries ranked by renewable energy share (%) |
| 4 | **Choropleth World Map** | Renewable electricity generating capacity per capita, by country |
| 5 | Scatter Plot | Access to electricity vs. GDP per capita |
| 6 | Animated Scatter Plot | Access to clean cooking fuels vs. GDP per capita, animated 2000→2020 |

Four KPI cards (total countries, average renewable share, average electricity access,
average CO₂ emissions) summarise the dataset at the top of the dashboard.

---

## Interactive Features

- **Hover tooltips** on every chart, showing the underlying values.
- **Filtering** by year and by country via the header controls (with a *Reset Filter* button).
- **Zooming & panning** — scroll-to-zoom / drag-to-pan on the scatter plot and the world map.
- **Linked interactions** — selecting a country in one chart highlights it across the bar
  chart, choropleth map, and both scatter plots simultaneously.
- **Animation** — the animated scatter plot plays through 2000–2020 to reveal how countries
  progress over time.

---

## Project Structure

```
.
├── index.html                     # Dashboard markup + data loading / filter wiring
├── style.css                      # Dashboard styling (teal theme, cards, tooltips)
├── streamlit_app.py               # Optional Streamlit wrapper for deployment
├── requirements.txt               # Python dependency for Streamlit
├── data/
│  ├── Data Preprocessing.ipynb
│  ├── cleaned_sustainable_energy.csv
│  └── global-data-on-sustainable-energy.csv  # Raw dataset
└── js/
    ├── stackedArea.js             # Vis 1
    ├── linechart.js               # Vis 2
    ├── barChart.js                # Vis 3
    ├── choropleth.js              # Vis 4  (needs worldGeo.js)
    ├── worldGeo.js                # Embedded world boundaries (GeoJSON) for the map
    ├── scatterPlot.js             # Vis 5
    └── animatedScatter.js         # Vis 6
```

> `worldGeo.js` embeds the Natural Earth (110m) country boundaries as a JavaScript object
> (`WORLD_GEO`), so the map works fully offline with no additional CDN or `.json` file.

---

## Running Locally

The dashboard loads the CSV with `d3.csv(...)`, which uses `fetch`. Opening `index.html`
directly from the file system (`file://`) will be blocked by the browser's CORS policy,
so **serve the folder over HTTP** using any one of the options below.

**Option A — VS Code Live Server (easiest)**
1. Install the *Live Server* extension.
2. Right-click `index.html` → **Open with Live Server**.

**Option B — Python's built-in server**
```bash
# from the project root
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

**Option C — Node**
```bash
npx serve .
```

An internet connection is required the first time, because D3.js is loaded from a CDN
(`https://d3js.org/d3.v7.min.js`).

---

## Deploying to Streamlit

A `streamlit_app.py` wrapper is included so the dashboard can be published on
**Streamlit Community Cloud**. Because Streamlit renders HTML inside a sandboxed iframe
(with no web server behind it), the wrapper assembles a single self-contained HTML
document at runtime — inlining `style.css`, all `js/*.js` files, and the CSV data, and
redirecting `d3.csv(...)` to the embedded data. No changes to the original files are needed.

**Run it locally**
```bash
python -m venv .venv                     # create a virtual environment
# Windows (PowerShell):  .\.venv\Scripts\Activate.ps1
# macOS / Linux:         source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

---

## Tech Stack

- **D3.js v7** — all visualisations
- **HTML / CSS / JavaScript** — structure, styling, interaction
- **Streamlit** — optional deployment wrapper
- Boundary data: Natural Earth (via `world-atlas`), embedded as GeoJSON

---

## Academic Integrity

This dashboard was developed for CDS6324. All data transformations, visualisations, and
conclusions reflect the group's own understanding of the dataset and the SDG 7 theme.
