// vis5.js
function scatterPlot(data) {
    const svg = d3.select("#vis5")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
 
    // to keep dots inside graph boundaries when zooming
    svg.append("defs").append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
 
    let displayData = data.filter(d => d.year === 2020 && d.gdp_per_capita > 0);
 
    const xScale = d3.scaleLog()
        .domain([100, d3.max(data, d => d.gdp_per_capita)])
        .range([0, width]);
 
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
 
    const xAxis = d3.axisBottom(xScale).ticks(5, "~s");
    const yAxis = d3.axisLeft(yScale);
 
    const gX = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);
 
    const gY = svg.append("g")
        .attr("class", "axis")
        .call(yAxis);
 
    svg.append("text").attr("x", width/2).attr("y", height + 35).style("text-anchor", "middle").text("GDP per capita");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -55).style("text-anchor", "middle").text("Access to Electricity (%)");
 
    const tooltip = d3.select("#tooltip5");
 
    const chartBody = svg.append("g")
        .attr("clip-path", "url(#chart-clip)");
 
    const dots = chartBody.selectAll(".dot")
        .data(displayData, d => d.country)
        .enter()
        .append("circle")
        .attr("class", "dot v5-dot")
        .attr("cx", d => xScale(d.gdp_per_capita))
        .attr("cy", d => yScale(d.access_electricity_pct))
        .attr("r", 6)
        .attr("fill", "#34495e")
        .style("stroke", "#fff")
        .style("stroke-width", "1px")
        .style("opacity", 0.85)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                   .html(`<strong>${d.country}</strong><br>GDP per capita: $${Math.round(d.gdp_per_capita).toLocaleString()}<br>Electricity Access: ${d.access_electricity_pct}%`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.offsetX + 15) + "px")
                   .style("top", (event.offsetY - 15) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            selectedCountry = (selectedCountry === d.country) ? null : d.country;
            updateGlobalHighlights();
        });
 
    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .extent([[0, 0], [width, height]])
        .on("zoom", function(event) {
            const newXScale = event.transform.rescaleX(xScale);
            const newYScale = event.transform.rescaleY(yScale);
            
            gX.call(xAxis.scale(newXScale));
            gY.call(yAxis.scale(newYScale));
            
            dots.attr("cx", d => newXScale(d.gdp_per_capita))
                .attr("cy", d => newYScale(d.access_electricity_pct));
        });
 
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .lower() 
        .call(zoom);
}