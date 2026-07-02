d3.csv("data/cleaned_sustainable_energy.csv", d3.autoType).then(data => {
 
    const yearlyData = Array.from(
        d3.rollup(
            data,
            v => ({
                lowCarbon: d3.mean(v, d => d.low_carbon_electricity_pct)
            }),
            d => d.year
        ),
        ([year, values]) => ({ year, ...values })
    ).sort((a, b) => a.year - b.year);
 
    const svg = d3.select("#line-chart")
        .html("")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
 
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
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
 
    const xScale = d3.scaleLinear()
        .domain(d3.extent(yearlyData, d => d.year))
        .range([0, width]);
 
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(yearlyData, d => d.lowCarbon) - 1,
            d3.max(yearlyData, d => d.lowCarbon) + 1
        ])
        .nice()
        .range([height, 0]);
 
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.lowCarbon))
        .curve(d3.curveMonotoneX);
 
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(xScale)
                .tickFormat(d3.format("d"))
        );
 
    svg.append("g")
        .attr("class", "axis")
        .call(
            d3.axisLeft(yScale)
                .tickFormat(d => d + "%")
        );
 
    svg.append("path")
        .datum(yearlyData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .attr("d", line);
 
    svg.selectAll(".dot")
        .data(yearlyData)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.lowCarbon))
        .attr("r", 4)
        .attr("fill", "steelblue")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);
 
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .text("Year");
 
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text("Low-carbon Electricity (%)");
 
    const focusLine = svg.append("line")
        .attr("stroke", "#666")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5 5")
        .attr("y1", 0)
        .attr("y2", height)
        .style("display", "none");
 
    const focusDot = svg.append("circle")
        .attr("r", 6)
        .attr("fill", "orange")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("display", "none");
 
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .on("mousemove", function(event) {
 
            const mouseX = d3.pointer(event)[0];
            const year = Math.round(xScale.invert(mouseX));
            const selectedData = yearlyData.find(d => d.year === year);
 
            if (!selectedData) return;
 
            focusLine
                .style("display", "block")
                .attr("x1", xScale(year))
                .attr("x2", xScale(year));
 
            focusDot
                .style("display", "block")
                .attr("cx", xScale(selectedData.year))
                .attr("cy", yScale(selectedData.lowCarbon));
 
            tooltip
                .style("visibility", "visible")
                .style("top", (event.pageY + 15) + "px")
                .style("left", (event.pageX + 15) + "px")
                .html(`
                    <strong>Year: ${selectedData.year}</strong><br><br>
                    Low-carbon Electricity: ${d3.format(".2f")(selectedData.lowCarbon)}%
                `);
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            focusLine.style("display", "none");
            focusDot.style("display", "none");
        });
 
});
