// barChart.js
// Analytical Question 2 — Visualisation 3: Horizontal Bar Chart
//
// Two modes (toggle in the chart header):
//   • "Share (year)"      — ranks the leading countries by renewable energy share (%)
//                           for the selected year (follows the global year filter).
//   • "Progress '00->'20" — diverging chart of the CHANGE in renewable share between
//                           2000 and 2020, showing the biggest improvers and decliners.
//                           This directly answers "which countries made the greatest
//                           progress in renewable energy development?".
//
// Interactions: hover tooltip, year filtering (share mode), mode toggle, country
// selection, and linked highlighting with the scatter plots + choropleth map.

function barChart(data) {

    // ---- Layout (same overall box as the sibling charts; responsive.js makes it fluid) ----
    const totalW = width + margin.left + margin.right;   // 460
    const totalH = height + margin.top + margin.bottom;  // 310

    const m = { top: 15, right: 52, bottom: 34, left: 120 };
    const innerW = totalW - m.left - m.right;
    const innerH = totalH - m.top - m.bottom;

    const TOP_N = 15;                     // share mode: leading N
    const IMPROVERS = 10, DECLINERS = 5;  // progress mode: N up + N down
    const DEFAULT_YEAR = 2020;

    let mode = "share";                   // "share" | "progress"

    // ---- Pre-compute the 2000 -> 2020 change per country (progress mode) ----
    const v2000 = new Map(), v2020 = new Map();
    data.forEach(d => {
        const val = d.renewable_energy_share_pct;
        if (val == null || isNaN(val)) return;
        if (d.year === 2000) v2000.set(d.country, val);
        if (d.year === 2020) v2020.set(d.country, val);
    });
    const progressAll = [];
    v2000.forEach((val0, c) => {
        if (v2020.has(c)) {
            progressAll.push({ country: c, v2000: val0, v2020: v2020.get(c), delta: v2020.get(c) - val0 });
        }
    });
    progressAll.sort((a, b) => b.delta - a.delta);

    // ---- Inject the mode toggle into the card (persists across re-renders) ----
    const container = d3.select("#vis3-container");
    const controls = container.insert("div", "#vis3").attr("class", "chart-controls");
    const btnShare = controls.append("button")
        .attr("class", "toggle-btn active").text("Share")
        .on("click", () => setMode("share"));
    const btnProg = controls.append("button")
        .attr("class", "toggle-btn").text("Progress '00->'20")
        .on("click", () => setMode("progress"));

    function setMode(newMode) {
        mode = newMode;
        btnShare.classed("active", mode === "share");
        btnProg.classed("active", mode === "progress");
        render();
    }

    // ---- SVG scaffold (built once) ----
    const svg = d3.select("#vis3")
        .html("")
        .append("svg")
        .attr("width", totalW)
        .attr("height", totalH)
        .append("g")
        .attr("transform", `translate(${m.left}, ${m.top})`);

    const gY = svg.append("g").attr("class", "axis");
    const gX = svg.append("g").attr("class", "axis").attr("transform", `translate(0, ${innerH})`);
    const zeroLine = svg.append("line")
        .attr("y1", 0).attr("y2", innerH)
        .attr("stroke", "#94a3a0").attr("stroke-width", 1)
        .style("display", "none");

    const xTitle = svg.append("text")
        .attr("x", innerW / 2).attr("y", innerH + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").style("fill", "#4b6663");

    const subtitle = svg.append("text")
        .attr("x", innerW).attr("y", -2)
        .attr("text-anchor", "end")
        .style("font-size", "11px").style("font-weight", "700")
        .style("fill", "var(--teal-800)");

    const tooltip = d3.select("#tooltip3").style("opacity", 0);

    // ---- Scales ----
    const xScale = d3.scaleLinear().range([0, innerW]);
    const yScale = d3.scaleBand().range([0, innerH]).padding(0.22);
    const shareColor = d3.scaleLinear().range(["#5eead4", "#0f766e"]).interpolate(d3.interpolateRgb);

    function currentYear() {
        const v = d3.select("#year-filter").property("value");
        return v ? +v : DEFAULT_YEAR;
    }

    function getRows() {
        if (mode === "progress") {
            let rows = progressAll.slice(0, IMPROVERS).concat(progressAll.slice(-DECLINERS));
            rows = rows.filter((r, i, a) => a.findIndex(x => x.country === r.country) === i);
            if (selectedCountry && !rows.some(r => r.country === selectedCountry)) {
                const sel = progressAll.find(r => r.country === selectedCountry);
                if (sel) rows = rows.concat(sel);
            }
            return rows.map(r => ({ country: r.country, value: r.delta, meta: r }));
        }
        const year = currentYear();
        let rows = data.filter(d =>
            d.year === year && d.renewable_energy_share_pct != null && !isNaN(d.renewable_energy_share_pct));
        rows.sort((a, b) => b.renewable_energy_share_pct - a.renewable_energy_share_pct);
        let top = rows.slice(0, TOP_N);
        if (selectedCountry && !top.some(d => d.country === selectedCountry)) {
            const sel = rows.find(d => d.country === selectedCountry);
            if (sel) top = top.concat(sel);
        }
        return top.map(d => ({ country: d.country, value: d.renewable_energy_share_pct, meta: d, year }));
    }

    function colorFor(d) {
        if (selectedCountry && d.country === selectedCountry) return "var(--accent)";
        if (mode === "progress") return d.value >= 0 ? "#0d9488" : "#ef8c4b";
        return shareColor(d.value);
    }

    function render() {
        const rows = getRows();

        if (mode === "progress") {
            subtitle.text("Change in share . 2000->2020");
            xTitle.text("Change in Renewable Share (percentage points)");
            const ext = d3.extent(rows, d => d.value);
            const pad = Math.max(2, (ext[1] - ext[0]) * 0.05);
            xScale.domain([Math.min(0, ext[0]) - pad, Math.max(0, ext[1]) + pad]);
            gX.call(d3.axisBottom(xScale).ticks(5).tickFormat(d => (d > 0 ? "+" : "") + d));
            zeroLine.style("display", null).attr("x1", xScale(0)).attr("x2", xScale(0));
        } else {
            subtitle.text(`Top ${TOP_N} countries . ${currentYear()}`);
            xTitle.text("Renewable Energy Share (%)");
            const maxVal = d3.max(rows, d => d.value) || 100;
            xScale.domain([0, maxVal]).nice();
            shareColor.domain([0, maxVal]);
            gX.call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + "%"));
            zeroLine.style("display", "none");
        }

        yScale.domain(rows.map(d => d.country));
        gY.call(d3.axisLeft(yScale).tickSize(0));
        gY.select(".domain").remove();

        const base = xScale(mode === "progress" ? 0 : xScale.domain()[0]);

        const bars = svg.selectAll(".bar").data(rows, d => d.country);
        bars.exit().remove();
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", base).attr("width", 0)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) { tooltip.style("opacity", 1).html(tooltipHtml(d)); })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.offsetX + 15) + "px").style("top", (event.offsetY + 15) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0))
            .on("click", function (event, d) {
                selectedCountry = (selectedCountry === d.country) ? null : d.country;
                updateGlobalHighlights();
            })
            .merge(bars)
            .attr("y", d => yScale(d.country))
            .attr("height", yScale.bandwidth())
            .transition().duration(500)
            .attr("x", d => Math.min(xScale(d.value), base))
            .attr("width", d => Math.abs(xScale(d.value) - base));

        const labels = svg.selectAll(".bar-value").data(rows, d => d.country);
        labels.exit().remove();
        labels.enter().append("text")
            .attr("class", "bar-value")
            .style("font-size", "10px").style("fill", "#4b6663")
            .merge(labels)
            .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2 + 3)
            .style("text-anchor", d => (mode === "progress" && d.value < 0) ? "end" : "start")
            .transition().duration(500)
            .attr("x", d => xScale(d.value) + ((mode === "progress" && d.value < 0) ? -4 : 4))
            .text(d => (mode === "progress" && d.value > 0 ? "+" : "") + d3.format(".1f")(d.value) + (mode === "progress" ? "" : "%"));

        highlight();
    }

    function tooltipHtml(d) {
        if (mode === "progress") {
            const r = d.meta;
            return `<strong>${d.country}</strong><br>2000: ${d3.format(".1f")(r.v2000)}%<br>2020: ${d3.format(".1f")(r.v2020)}%<br>Change: ${(r.delta >= 0 ? "+" : "")}${d3.format(".2f")(r.delta)} pp`;
        }
        return `<strong>${d.country}</strong> (${d.year})<br>Renewable Share: ${d3.format(".2f")(d.value)}%`;
    }

    function highlight() {
        svg.selectAll(".bar")
            .style("fill", d => colorFor(d))
            .style("opacity", d => (selectedCountry && d.country !== selectedCountry) ? 0.35 : 1)
            .style("stroke", d => (selectedCountry && d.country === selectedCountry) ? "#c2410c" : "none")
            .style("stroke-width", d => (selectedCountry && d.country === selectedCountry) ? 1.5 : 0);
        svg.selectAll(".bar-value")
            .style("font-weight", d => (selectedCountry && d.country === selectedCountry) ? "700" : "400")
            .style("opacity", d => (selectedCountry && d.country !== selectedCountry) ? 0.4 : 1);
    }

    window.renderBarChart = render;
    window.highlightBarChart = highlight;

    render();
}
