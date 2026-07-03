"""
Global Sustainable Energy Dashboard — Streamlit wrapper.

The dashboard itself is a static D3.js site (index.html + js/*.js + data/*.csv).
Streamlit renders HTML inside a sandboxed iframe with no web server behind it,
so the site's relative `<script src="js/...">` and `d3.csv("data/...")` calls
cannot be resolved as-is. This wrapper solves that by assembling ONE
self-contained HTML document at runtime:

  1. Inlines style.css into a <style> block.
  2. Inlines every js/*.js file (in the same order as index.html).
  3. Embeds the CSV as text and shims `d3.csv(...)` to return it,
     so no network/file fetch is needed inside the iframe.

Nothing in the original repo needs to be modified. Keep this file at the repo
root (next to index.html) and deploy with requirements.txt (streamlit).
"""

from pathlib import Path
import re
import html as _html

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Global Sustainable Energy Dashboard",
    page_icon="⚡",
    layout="wide",
)

# Repo root = folder containing this file. Adjust if you place it elsewhere.
ROOT = Path(__file__).resolve().parent

INDEX_HTML = ROOT / "index.html"
STYLE_CSS = ROOT / "style.css"
CSV_PATH = ROOT / "data" / "cleaned_sustainable_energy.csv"

# Load JS files in the exact order index.html lists them (order matters:
# worldGeo.js must precede choropleth.js).
JS_ORDER = [
    "js/stackedArea.js",
    "js/linechart.js",
    "js/scatterPlot.js",
    "js/animatedScatter.js",
    "js/worldGeo.js",
    "js/barChart.js",
    "js/choropleth.js",
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_document() -> str:
    index_src = read(INDEX_HTML)
    css = read(STYLE_CSS)
    csv_text = read(CSV_PATH)

    # 1) Replace the external stylesheet link with an inline <style> block.
    index_src = re.sub(
        r'<link[^>]+href=["\']style\.css["\'][^>]*>',
        f"<style>\n{css}\n</style>",
        index_src,
        count=1,
    )

    # 2) Remove all <script src="js/..."> tags; we inline them ourselves.
    index_src = re.sub(r'<script[^>]+src=["\']js/[^"\']+["\'][^>]*>\s*</script>', "", index_src)

    # 3) Build the inlined bundle: CSV data + d3.csv shim + all chart JS.
    #    The CSV is stored in a non-executing <script type="text/plain"> block
    #    to avoid any string-escaping issues. d3 is already loaded from the CDN
    #    <script> in <head>, so the shim can reference it here.
    js_bundle = "\n".join(read(ROOT / p) for p in JS_ORDER)

    inlined = f"""
<script type="text/plain" id="__csv_data">{csv_text}</script>
<script>
  (function () {{
    var CSV_TEXT = document.getElementById("__csv_data").textContent;
    // Redirect every d3.csv("data/...") call to the embedded CSV.
    // Resolve on a macrotask (setTimeout) so it mimics real network timing:
    // this guarantees the page's inline <script> (which defines margin/width/
    // height and calls the chart functions) has fully run before any chart's
    // .then() callback fires — matching how the site behaves with a real fetch.
    d3.csv = function (url, rowfn) {{
      return new Promise(function (resolve) {{
        setTimeout(function () {{
          resolve(rowfn ? d3.csvParse(CSV_TEXT, rowfn) : d3.csvParse(CSV_TEXT));
        }}, 0);
      }});
    }};
  }})();
</script>
<script>
{js_bundle}
</script>
"""

    # Insert the inlined bundle right before the page's own inline <script>
    # (the one that starts with "let selectedCountry"), so the d3.csv shim and
    # all chart definitions exist before that script runs.
    marker = "<script>\n    let selectedCountry"
    if marker in index_src:
        index_src = index_src.replace(marker, inlined + "\n<script>\n    let selectedCountry", 1)
    else:
        # Fallback: inject just before </body>.
        index_src = index_src.replace("</body>", inlined + "\n</body>", 1)

    return index_src


def main():
    missing = [str(p) for p in [INDEX_HTML, STYLE_CSS, CSV_PATH] if not p.exists()]
    missing += [f"js/{Path(p).name}" for p in JS_ORDER if not (ROOT / p).exists()]
    if missing:
        st.error(
            "Some project files were not found relative to this app:\n\n- "
            + "\n- ".join(missing)
            + "\n\nMake sure streamlit_app.py sits at the repo root, next to "
            "index.html, style.css, the js/ folder and data/ folder."
        )
        return

    doc = build_document()

    # The dashboard is tall (header + KPI row + two 430px chart rows). Give the
    # iframe generous height and allow scrolling so nothing is clipped.
    components.html(doc, height=1650, scrolling=True)


if __name__ == "__main__":
    main()
