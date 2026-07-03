// js/scatterPlot.js

function scatterPlot(data) {
    const totalW = width + margin.left + margin.right;
    const totalH = height + margin.top + margin.bottom;

    const svg = d3.select("#vis5")
        .append("svg")
        .attr("width", totalW)
        .attr("height", totalH);

    svg.append("defs").append("clipPath")
        .attr("id", "scatter-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    const chartArea = svg.append("g")
        .attr("clip-path", "url(#scatter-clip)")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
    const g = chartArea.append("g");

    const xScale = d3.scaleLog()
        .domain([100, d3.max(data, d => d.gdp_per_capita)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).ticks(5, "~s");
    const yAxis = d3.axisLeft(yScale);

    const gX = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
        .call(xAxis);
        
    const gY = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(yAxis);

    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 35)
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text("GDP per capita (USD Log Scale)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(margin.top + height / 2))
        .attr("y", margin.left - 50)
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text("Access to Electricity (%)");

    const tooltip = d3.select("#tooltip5");

    function paintScatter(targetYear) {
        const selectedYear = targetYear ? +targetYear : 2020;

        // Filter active frame rows
        let displayData = data.filter(d => d.year === selectedYear && d.gdp_per_capita > 0);

        const dots = g.selectAll(".dot")
            .data(displayData, d => d.country);

        dots.exit().remove();

        dots.enter()
            .append("circle")
            .attr("class", "dot")
            .merge(dots)
            .attr("cx", d => xScale(d.gdp_per_capita))
            .attr("cy", d => yScale(d.access_electricity_pct))
            .attr("r", 5.5)
            .attr("fill", "#34495e")
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 1)
                       .html(`<strong>${d.country}</strong> (${d.year})<br>
                              GDP per capita: $${Math.round(d.gdp_per_capita).toLocaleString()}<br>
                              Electricity Access: ${d.access_electricity_pct}%`);
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

        updateGlobalHighlights();
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 12])
        .extent([[0, 0], [width, height]])
        .on("zoom", function(event) {
            g.attr("transform", event.transform);
            gX.call(xAxis.scale(event.transform.rescaleX(xScale)));
            gY.call(yAxis.scale(event.transform.rescaleY(yScale)));
        });

    svg.call(zoom);

    paintScatter(2020);

    window.renderScatterPlot = function() {
        const activeYearSelection = d3.select("#year-filter").property("value");
        paintScatter(activeYearSelection);
    };
}
