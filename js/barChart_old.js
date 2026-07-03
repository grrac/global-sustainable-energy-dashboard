// barChart.js
// Analytical Question 2 — Visualisation 3: Horizontal Bar Chart
// Compares renewable energy share (% of total final energy consumption) across countries.
// Interactions: hover tooltip, year filtering, country selection/highlighting, and
// linked highlighting with the other dashboard charts (scatter plot + choropleth map).

function barChart(data) {

    // ---- Layout (kept the same overall box size as the sibling charts) ----
    const totalW = width + margin.left + margin.right;   // 460
    const totalH = height + margin.top + margin.bottom;  // 310

    const m = { top: 15, right: 48, bottom: 34, left: 118 };
    const innerW = totalW - m.left - m.right;
    const innerH = totalH - m.top - m.bottom;

    const TOP_N = 15;          // show the leading 15 countries
    const DEFAULT_YEAR = 2020; // used when the global year filter is "All Years"

    // ---- SVG scaffold (built once) ----
    const svg = d3.select("#vis3")
        .html("")
        .append("svg")
        .attr("width", totalW)
        .attr("height", totalH)
        .append("g")
        .attr("transform", `translate(${m.left}, ${m.top})`);

    const gY = svg.append("g").attr("class", "axis");
    const gX = svg.append("g").attr("class", "axis")
        .attr("transform", `translate(0, ${innerH})`);

    // Axis title + dynamic subtitle
    svg.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#4b6663")
        .text("Renewable Energy Share (%)");

    const subtitle = svg.append("text")
        .attr("class", "bar-subtitle")
        .attr("x", innerW)
        .attr("y", -2)
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style("font-weight", "700")
        .style("fill", "var(--teal-800)");

    const tooltip = d3.select("#tooltip3").style("opacity", 0);

    // ---- Scales ----
    const xScale = d3.scaleLinear().range([0, innerW]);
    const yScale = d3.scaleBand().range([0, innerH]).padding(0.22);

    // teal ramp from light -> dark based on the value
    const colorScale = d3.scaleLinear()
        .range(["#5eead4", "#0f766e"])
        .interpolate(d3.interpolateRgb);

    // ---- Helpers ----
    function currentYear() {
        const v = d3.select("#year-filter").property("value");
        return v ? +v : DEFAULT_YEAR;
    }

    function getRanked(year) {
        // one row per country for the chosen year, valid renewable share
        const rows = data.filter(d =>
            d.year === year &&
            d.renewable_energy_share_pct != null &&
            !isNaN(d.renewable_energy_share_pct)
        );

        rows.sort((a, b) => b.renewable_energy_share_pct - a.renewable_energy_share_pct);
        let top = rows.slice(0, TOP_N);

        // Make sure a selected country is always visible, even outside the top N
        if (selectedCountry && !top.some(d => d.country === selectedCountry)) {
            const sel = rows.find(d => d.country === selectedCountry);
            if (sel) top = top.concat(sel);
        }
        return top;
    }

    // ---- Render (re-runs whenever the year / selection changes) ----
    function render() {
        const year = currentYear();
        const ranked = getRanked(year);

        subtitle.text(`Top ${TOP_N} countries · ${year}`);

        const maxVal = d3.max(ranked, d => d.renewable_energy_share_pct) || 100;
        xScale.domain([0, maxVal]).nice();
        yScale.domain(ranked.map(d => d.country));
        colorScale.domain([0, maxVal]);

        // Axes
        gY.call(d3.axisLeft(yScale).tickSize(0));
        gY.select(".domain").remove();
        gX.call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + "%"));

        // Bars (data-joined by country)
        const bars = svg.selectAll(".bar")
            .data(ranked, d => d.country);

        bars.exit().remove();

        const barsEnter = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", 0)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.country}</strong> (${d.year})<br>Renewable Share: ${d3.format(".2f")(d.renewable_energy_share_pct)}%`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.offsetX + 15) + "px")
                    .style("top", (event.offsetY + 15) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            })
            .on("click", function (event, d) {
                selectedCountry = (selectedCountry === d.country) ? null : d.country;
                updateGlobalHighlights();
            });

        barsEnter.merge(bars)
            .attr("y", d => yScale(d.country))
            .attr("height", yScale.bandwidth())
            .transition().duration(500)
            .attr("width", d => xScale(d.renewable_energy_share_pct));

        // Value labels at the end of each bar
        const labels = svg.selectAll(".bar-value")
            .data(ranked, d => d.country);

        labels.exit().remove();

        labels.enter()
            .append("text")
            .attr("class", "bar-value")
            .style("font-size", "10px")
            .style("fill", "#4b6663")
            .merge(labels)
            .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2 + 3)
            .transition().duration(500)
            .attr("x", d => xScale(d.renewable_energy_share_pct) + 4)
            .text(d => d3.format(".1f")(d.renewable_energy_share_pct) + "%");

        highlight();
    }

    // ---- Highlighting (linked interaction) ----
    function highlight() {
        svg.selectAll(".bar")
            .style("fill", d => (selectedCountry && d.country === selectedCountry)
                ? "var(--accent)"
                : colorScale(d.renewable_energy_share_pct))
            .style("opacity", d => (selectedCountry && d.country !== selectedCountry) ? 0.35 : 1)
            .style("stroke", d => (selectedCountry && d.country === selectedCountry) ? "#c2410c" : "none")
            .style("stroke-width", d => (selectedCountry && d.country === selectedCountry) ? 1.5 : 0);

        svg.selectAll(".bar-value")
            .style("font-weight", d => (selectedCountry && d.country === selectedCountry) ? "700" : "400")
            .style("opacity", d => (selectedCountry && d.country !== selectedCountry) ? 0.4 : 1);
    }

    // Expose so index.html can re-render on filter change and refresh linked highlights
    window.renderBarChart = render;
    window.highlightBarChart = highlight;

    render();
}
