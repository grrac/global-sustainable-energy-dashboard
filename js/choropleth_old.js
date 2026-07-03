// choropleth.js
// Analytical Question 2 — Visualisation 4: Choropleth World Map
// Shows renewable-electricity-generating capacity per capita across countries.
// Interactions: hover tooltip + country highlight, zoom / pan, year filtering,
// country selection, and linked highlighting with the scatter plot + bar chart.
//
// Depends on WORLD_GEO (a GeoJSON FeatureCollection) from js/worldGeo.js.

function choropleth(data) {

    // ---- Layout (same overall box size as the sibling charts) ----
    const totalW = width + margin.left + margin.right;   // 460
    const totalH = height + margin.top + margin.bottom;  // 310

    const m = { top: 6, right: 6, bottom: 40, left: 6 };
    const innerW = totalW - m.left - m.right;
    const innerH = totalH - m.top - m.bottom;

    const DEFAULT_YEAR = 2020;
    const NO_DATA = "#e6eeec";

    // Map from GeoJSON country name -> CSV country name (only where they differ)
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
    const csvName = geoName => GEO_TO_CSV[geoName] || geoName;

    // ---- SVG scaffold ----
    const svg = d3.select("#vis4")
        .html("")
        .append("svg")
        .attr("width", totalW)
        .attr("height", totalH);

    // clip so panned/zoomed countries stay inside the card
    svg.append("defs").append("clipPath")
        .attr("id", "map-clip")
        .append("rect")
        .attr("x", m.left).attr("y", m.top)
        .attr("width", innerW).attr("height", innerH);

    const mapArea = svg.append("g")
        .attr("clip-path", "url(#map-clip)")
        .attr("transform", `translate(${m.left}, ${m.top})`);

    const g = mapArea.append("g"); // zoom/pan target

    // ---- Projection fit to the panel ----
    const projection = d3.geoNaturalEarth1()
        .fitSize([innerW, innerH], WORLD_GEO);
    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("#tooltip4").style("opacity", 0);

    // Sequential (square-root) teal scale — capacity per capita is heavily skewed
    const colorScale = d3.scaleSequentialSqrt(
        t => d3.interpolateRgb("#ccfbf1", "#0f4a44")(t)
    );

    // ---- Helpers ----
    function currentYear() {
        const v = d3.select("#year-filter").property("value");
        return v ? +v : DEFAULT_YEAR;
    }

    function valuesForYear(year) {
        const byCountry = new Map();
        data.forEach(d => {
            if (d.year === year &&
                d.renewable_capacity_per_capita != null &&
                !isNaN(d.renewable_capacity_per_capita)) {
                byCountry.set(d.country, d.renewable_capacity_per_capita);
            }
        });
        return byCountry;
    }

    let valueMap = new Map();

    // ---- Draw countries once ----
    const countries = g.selectAll("path.country")
        .data(WORLD_GEO.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.4)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#0f4a44").attr("stroke-width", 1.2).raise();
            const name = csvName(d.properties.name);
            const val = valueMap.get(name);
            tooltip.style("opacity", 1)
                .html(`<strong>${name}</strong> (${currentYear()})<br>Renewable Capacity: ${val != null ? d3.format(",.1f")(val) + " W/person" : "No data"}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.offsetX + 15) + "px")
                .style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseout", function (event, d) {
            const name = csvName(d.properties.name);
            const isSel = selectedCountry && name === selectedCountry;
            d3.select(this)
                .attr("stroke", isSel ? "#f97316" : "#ffffff")
                .attr("stroke-width", isSel ? 1.8 : 0.4);
            tooltip.style("opacity", 0);
        })
        .on("click", function (event, d) {
            const name = csvName(d.properties.name);
            selectedCountry = (selectedCountry === name) ? null : name;
            updateGlobalHighlights();
        });

    // ---- Legend (gradient bar) ----
    const legendW = 150, legendH = 8;
    const legendX = m.left + 8, legendY = totalH - 22;

    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "map-gradient");
    d3.range(0, 1.01, 0.1).forEach(t => {
        grad.append("stop")
            .attr("offset", (t * 100) + "%")
            .attr("stop-color", d3.interpolateRgb("#ccfbf1", "#0f4a44")(t));
    });

    const legend = svg.append("g");
    legend.append("rect")
        .attr("x", legendX).attr("y", legendY)
        .attr("width", legendW).attr("height", legendH)
        .attr("rx", 2)
        .style("fill", "url(#map-gradient)")
        .style("stroke", "#cbd5d1").style("stroke-width", 0.5);

    const legendMin = legend.append("text")
        .attr("x", legendX).attr("y", legendY - 4)
        .style("font-size", "9px").style("fill", "#4b6663").text("0");
    const legendMax = legend.append("text")
        .attr("x", legendX + legendW).attr("y", legendY - 4)
        .attr("text-anchor", "end")
        .style("font-size", "9px").style("fill", "#4b6663").text("");
    legend.append("text")
        .attr("x", legendX + legendW / 2).attr("y", legendY + legendH + 11)
        .attr("text-anchor", "middle")
        .style("font-size", "9px").style("fill", "#7a9c98")
        .text("Renewable capacity per capita (W/person)");

    // ---- Render (fills + legend update on year change) ----
    function render() {
        const year = currentYear();
        valueMap = valuesForYear(year);

        const maxVal = d3.max([...valueMap.values()]) || 1;
        colorScale.domain([0, maxVal]);
        legendMax.text(d3.format(",.0f")(maxVal));

        countries.transition().duration(400)
            .attr("fill", d => {
                const val = valueMap.get(csvName(d.properties.name));
                return (val == null) ? NO_DATA : colorScale(val);
            });

        highlight();
    }

    // ---- Highlighting (linked interaction) ----
    function highlight() {
        countries
            .attr("stroke", d => (selectedCountry && csvName(d.properties.name) === selectedCountry) ? "#f97316" : "#ffffff")
            .attr("stroke-width", d => (selectedCountry && csvName(d.properties.name) === selectedCountry) ? 1.8 : 0.4)
            .style("opacity", d => {
                if (!selectedCountry) return 1;
                return csvName(d.properties.name) === selectedCountry ? 1 : 0.5;
            });
        countries.filter(d => selectedCountry && csvName(d.properties.name) === selectedCountry).raise();
    }

    // ---- Zoom / pan ----
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [innerW, innerH]])
        .on("zoom", function (event) {
            g.attr("transform", event.transform);
            // keep borders crisp as we zoom in
            g.selectAll("path.country")
                .attr("stroke-width", d =>
                    ((selectedCountry && csvName(d.properties.name) === selectedCountry) ? 1.8 : 0.4) / event.transform.k);
        });

    svg.call(zoom);

    // Expose for filter changes + linked highlights
    window.renderChoropleth = render;
    window.highlightChoropleth = highlight;

    render();
}
