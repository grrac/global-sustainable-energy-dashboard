// choropleth.js
// Analytical Question 2 — Visualisation 4: Choropleth World Map (animated)
// Renewable-electricity-generating capacity per capita across countries.
//
// Interactions: hover tooltip + country highlight, zoom / pan, YEAR SLIDER with
// PLAY/PAUSE animation (2000 -> 2020), year filtering, country selection, and
// linked highlighting with the scatter plots + bar chart.
//
// Depends on WORLD_GEO (GeoJSON FeatureCollection) from js/worldGeo.js.

function choropleth(data) {

    const totalW = width + margin.left + margin.right;   // 460
    const totalH = height + margin.top + margin.bottom;  // 310
    const m = { top: 6, right: 6, bottom: 40, left: 6 };
    const innerW = totalW - m.left - m.right;
    const innerH = totalH - m.top - m.bottom;

    const YEAR_MIN = 2000, YEAR_MAX = 2020, DEFAULT_YEAR = 2020;
    const NO_DATA = "#e6eeec";
    let currentYear = DEFAULT_YEAR;
    let timer = null;

    // GeoJSON name -> CSV name (only where they differ)
    const GEO_TO_CSV = {
        "United States of America": "United States",
        "Macedonia": "North Macedonia",
        "Bosnia and Herz.": "Bosnia and Herzegovina",
        "Central African Rep.": "Central African Republic",
        "Dominican Rep.": "Dominican Republic",
        "Eq. Guinea": "Equatorial Guinea",
        "S. Sudan": "South Sudan",
        "Solomon Is.": "Solomon Islands",
        "eSwatini": "Eswatini"
    };
    const csvName = g => GEO_TO_CSV[g] || g;

    // Global maximum across all years -> a STABLE colour scale, so the animation
    // shows real growth rather than a scale that rescales every frame.
    const globalMax = d3.max(data, d =>
        (d.renewable_capacity_per_capita != null && !isNaN(d.renewable_capacity_per_capita))
            ? d.renewable_capacity_per_capita : 0) || 1;

    // ---- Inject animation controls into the card ----
    const container = d3.select("#vis4-container");
    const controls = container.insert("div", "#vis4").attr("class", "chart-controls");
    const playBtn = controls.append("button").attr("class", "map-play-btn").text("Play");
    const slider = controls.append("input")
        .attr("type", "range").attr("class", "map-year-slider")
        .attr("min", YEAR_MIN).attr("max", YEAR_MAX).attr("step", 1).attr("value", currentYear);
    const yearLabel = controls.append("span").attr("class", "map-year-label").text(currentYear);

    // ---- SVG scaffold ----
    const svg = d3.select("#vis4").html("").append("svg")
        .attr("width", totalW).attr("height", totalH);

    svg.append("defs").append("clipPath").attr("id", "map-clip").append("rect")
        .attr("x", m.left).attr("y", m.top).attr("width", innerW).attr("height", innerH);

    const mapArea = svg.append("g")
        .attr("clip-path", "url(#map-clip)")
        .attr("transform", `translate(${m.left}, ${m.top})`);
    const g = mapArea.append("g");

    const projection = d3.geoNaturalEarth1().fitSize([innerW, innerH], WORLD_GEO);
    const path = d3.geoPath().projection(projection);
    const tooltip = d3.select("#tooltip4").style("opacity", 0);

    const colorScale = d3.scaleSequentialSqrt(t => d3.interpolateRgb("#ccfbf1", "#0f4a44")(t))
        .domain([0, globalMax]);

    function valuesForYear(year) {
        const map = new Map();
        data.forEach(d => {
            if (d.year === year && d.renewable_capacity_per_capita != null && !isNaN(d.renewable_capacity_per_capita)) {
                map.set(d.country, d.renewable_capacity_per_capita);
            }
        });
        return map;
    }
    let valueMap = valuesForYear(currentYear);

    // ---- Draw countries once ----
    const countries = g.selectAll("path.country")
        .data(WORLD_GEO.features).enter().append("path")
        .attr("class", "country").attr("d", path)
        .attr("stroke", "#ffffff").attr("stroke-width", 0.4)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#0f4a44").attr("stroke-width", 1.2).raise();
            const name = csvName(d.properties.name);
            const val = valueMap.get(name);
            tooltip.style("opacity", 1)
                .html(`<strong>${name}</strong> (${currentYear})<br>Renewable Capacity: ${val != null ? d3.format(",.1f")(val) + " W/person" : "No data"}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.offsetX + 15) + "px").style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseout", function (event, d) {
            const isSel = selectedCountry && csvName(d.properties.name) === selectedCountry;
            d3.select(this).attr("stroke", isSel ? "#f97316" : "#ffffff").attr("stroke-width", isSel ? 1.8 : 0.4);
            tooltip.style("opacity", 0);
        })
        .on("click", function (event, d) {
            const name = csvName(d.properties.name);
            selectedCountry = (selectedCountry === name) ? null : name;
            updateGlobalHighlights();
        });

    // ---- Legend ----
    const legendW = 150, legendH = 8, legendX = m.left + 8, legendY = totalH - 22;
    const grad = svg.append("defs").append("linearGradient").attr("id", "map-gradient");
    d3.range(0, 1.01, 0.1).forEach(t => {
        grad.append("stop").attr("offset", (t * 100) + "%")
            .attr("stop-color", d3.interpolateRgb("#ccfbf1", "#0f4a44")(t));
    });
    const legend = svg.append("g");
    legend.append("rect").attr("x", legendX).attr("y", legendY)
        .attr("width", legendW).attr("height", legendH).attr("rx", 2)
        .style("fill", "url(#map-gradient)").style("stroke", "#cbd5d1").style("stroke-width", 0.5);
    legend.append("text").attr("x", legendX).attr("y", legendY - 4)
        .style("font-size", "9px").style("fill", "#4b6663").text("0");
    legend.append("text").attr("x", legendX + legendW).attr("y", legendY - 4).attr("text-anchor", "end")
        .style("font-size", "9px").style("fill", "#4b6663").text(d3.format(",.0f")(globalMax));
    legend.append("text").attr("x", legendX + legendW / 2).attr("y", legendY + legendH + 11).attr("text-anchor", "middle")
        .style("font-size", "9px").style("fill", "#7a9c98").text("Renewable capacity per capita (W/person)");

    // ---- Render fills for a given year ----
    function paint(animated) {
        valueMap = valuesForYear(currentYear);
        yearLabel.text(currentYear);
        slider.property("value", currentYear);
        const sel = animated ? countries.transition().duration(250) : countries;
        sel.attr("fill", d => {
            const val = valueMap.get(csvName(d.properties.name));
            return (val == null) ? NO_DATA : colorScale(val);
        });
        highlight();
    }

    function highlight() {
        countries
            .attr("stroke", d => (selectedCountry && csvName(d.properties.name) === selectedCountry) ? "#f97316" : "#ffffff")
            .attr("stroke-width", d => (selectedCountry && csvName(d.properties.name) === selectedCountry) ? 1.8 : 0.4)
            .style("opacity", d => !selectedCountry ? 1 : (csvName(d.properties.name) === selectedCountry ? 1 : 0.5));
        countries.filter(d => selectedCountry && csvName(d.properties.name) === selectedCountry).raise();
    }

    // ---- Animation ----
    function stopAnim() {
        if (timer) { clearInterval(timer); timer = null; }
        playBtn.text("Play");
    }
    playBtn.on("click", function () {
        if (timer) { stopAnim(); return; }
        playBtn.text("Pause");
        if (currentYear >= YEAR_MAX) currentYear = YEAR_MIN; // restart if at end
        timer = setInterval(function () {
            currentYear++;
            if (currentYear > YEAR_MAX) { currentYear = YEAR_MAX; paint(true); stopAnim(); return; }
            paint(true);
        }, 700);
    });
    slider.on("input", function () {
        stopAnim();
        currentYear = +this.value;
        paint(false);
    });

    // ---- Zoom / pan ----
    const zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [innerW, innerH]])
        .on("zoom", function (event) {
            g.attr("transform", event.transform);
            g.selectAll("path.country").attr("stroke-width", d =>
                ((selectedCountry && csvName(d.properties.name) === selectedCountry) ? 1.8 : 0.4) / event.transform.k);
        });
    svg.call(zoom);

    // Exposed for the global filter + linked highlights.
    // On a global year-filter change, sync the map's year to it (and pause animation).
    window.renderChoropleth = function () {
        const v = d3.select("#year-filter").property("value");
        if (v) { stopAnim(); currentYear = +v; }
        paint(true);
    };
    window.highlightChoropleth = highlight;

    paint(false);
}
