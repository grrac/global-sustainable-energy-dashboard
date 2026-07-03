window.renderStackedArea = function(data) {
    
    window._energyData = data;
    const yearFilterVal = d3.select("#year-filter").property("value");
    const selectedYear = yearFilterVal ? +yearFilterVal : null;
    
    const filteredData = selectedCountry
        ? data.filter(d => d.country === selectedCountry)
        : data;
    // Aggregate yearly electricity generation data
    const yearlyData = Array.from(
        d3.rollup(
            filteredData,
            v => ({
                fossil: d3.sum(v, d => d.electricity_fossil_twh),
                renewables: d3.sum(v, d => d.electricity_renewables_twh),
                nuclear: d3.sum(v, d => d.electricity_nuclear_twh),
                lowCarbon: d3.mean(v, d => d.low_carbon_electricity_pct)
            }),
            d => d.year
        ),
        ([year, values]) => ({ year, ...values })
    ).sort((a, b) => a.year - b.year);

    // Define stack categories
    const keys = ["fossil", "renewables", "nuclear"];

    // Display labels for legend
    const legendLabels = {
        fossil: "Fossil Fuels",
        renewables: "Renewables",
        nuclear: "Nuclear"
    };
 
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#0f766e", "#14b8a6", "#f97316"]);
 
    const legendRowHeight = 26;
    const chartMargin = { ...margin, top: margin.top + legendRowHeight };
        
    // Create SVG container
    const svg = d3.select("#stacked-area")
        .html("")
        .append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

    // Display currently selected country
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -legendRowHeight - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "700")
        .style("fill", "var(--teal-800)")
        .text(selectedCountry ? selectedCountry : "All Countries (sum)");

    // Create tooltip
    d3.selectAll(".area-tooltip").remove();
    const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip area-tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("color", "#111")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("padding", "10px")
    .style("font-size", "13px")
    .style("box-shadow", "0px 2px 8px rgba(0,0,0,0.2)")
    .style("pointer-events", "none")
    .style("visibility", "hidden");

    // Generate stacked data
    const stackedData = d3.stack()
        .keys(keys)(yearlyData);
 
    const xScale = d3.scaleLinear()
        .domain(d3.extent(yearlyData, d => d.year))
        .range([0, width]);
 
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedData, layer => d3.max(layer, d => d[1]))])
        .nice()
        .range([height, 0]);
 
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));
 
    svg.selectAll(".area")
        .data(stackedData)
        .join("path")
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", d => color(d.key))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("opacity", 0.9);
 
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
 
    svg.append("g")
        .attr("class", "axis")
        .call(
            d3.axisLeft(yScale)
                .tickFormat(d => d3.format(".2s")(d).replace("k", "K"))
        );
 
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .text("Year");
 
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .text("Electricity Generation (TWh)");
    
     // Create vertical guideline for tooltip interaction
    const focusLine = svg.append("line")
        .attr("stroke", "#666")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5 5")
        .attr("y1", 0)
        .attr("y2", height)
        .style("display", "none");
    
     // Transparent overlay to capture mouse events
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .on("mousemove", function (event) {
            // Find nearest year based on mouse position
            const mouseX = d3.pointer(event)[0];
            const year = Math.round(xScale.invert(mouseX));
            const selectedData = yearlyData.find(d => d.year === year);
 
            if (!selectedData) return;
            // Update focus line
            focusLine
                .style("display", "block")
                .attr("x1", xScale(year))
                .attr("x2", xScale(year));
             // Display tooltip
            tooltip
                .style("visibility", "visible")
                .style("top", (event.pageY + 15) + "px")
                .style("left", (event.pageX + 15) + "px")
                .html(`
                    <strong>Year: ${selectedData.year}</strong><br><br>
                    Fossil Fuels: ${d3.format(",.0f")(selectedData.fossil)} TWh<br>
                    Renewables: ${d3.format(",.0f")(selectedData.renewables)} TWh<br>
                    Nuclear: ${d3.format(",.0f")(selectedData.nuclear)} TWh
                `);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            focusLine.style("display", "none");
        });
    
     // Highlight selected year
    if (selectedYear) {
        const yd = yearlyData.find(d => d.year === selectedYear);
        if (yd) {
            svg.append("line")
                .attr("class", "year-highlight")
                .attr("x1", xScale(selectedYear))
                .attr("x2", xScale(selectedYear))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "#111827")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 3")
                .attr("opacity", 0.6);
        }
    }
    // Create interactive legend
    const legendItemWidth = width / keys.length;
 
    const legend = svg.selectAll(".legend")
        .data(keys)
        .join("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${i * legendItemWidth}, ${-legendRowHeight})`)
        .style("cursor", "pointer")
        .on("mouseover", function (event, selectedKey) {
            svg.selectAll(".area")
                .attr("opacity", d => d.key === selectedKey ? 1 : 0.2);
        })
        .on("mouseout", function () {
            svg.selectAll(".area")
                .attr("opacity", 0.9);
        });
 
    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("y", 2)
        .attr("fill", d => color(d));
 
    legend.append("text")
        .attr("x", 18)
        .attr("y", 12)
        .style("font-size", "12px")
        .text(d => legendLabels[d]);
 
}
// Linked interaction 
window.highlightStackedArea = function () {
    if (window._energyData) window.renderStackedArea(window._energyData);
};
