// js/animatedScatter.js

function animatedScatter(data) {
    const svg = d3.select("#vis6")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
 
    const xScale = d3.scaleLog().domain([100, d3.max(data, d => d.gdp_per_capita)]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);
 
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5, "~s"));
 
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));
 
    svg.append("text").attr("x", width/2).attr("y", height + 35).style("text-anchor", "middle").text("GDP per capita");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -45).style("text-anchor", "middle").text("Access to Clean Cooking Fuels (%)");
 
    let currentYear = 2000;
    let timer = null;
    const tooltip = d3.select("#tooltip6");
 
    function updateChart(year) {
        d3.select("#current-year-display").text(`Year: ${year}`);
        let yearData = data.filter(d => d.year === year && d.gdp_per_capita > 0);
 
        const dots = svg.selectAll(".animated-dot")
            .data(yearData, d => d.country);
 
        dots.exit().remove();
 
        dots.enter()
            .append("circle")
            .attr("class", "animated-dot dot")
            .attr("r", 6)
            .attr("fill", "#14b8a6")
            .style("stroke", "#fff")
            .style("stroke-width", "1px")
            .style("opacity", 0.85)
            .merge(dots)
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 1).html(`<strong>${d.country}</strong> (${d.year})<br>GDP: $${Math.round(d.gdp_per_capita)}<br>Clean Cooking Access: ${d.clean_fuels_cooking_pct}%`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.offsetX + 15) + "px").style("top", (event.offsetY - 15) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0))
            .on("click", function(event, d) {
                selectedCountry = (selectedCountry === d.country) ? null : d.country;
                updateGlobalHighlights();
            })
            .transition()
            .duration(400) 
            .attr("cx", d => xScale(d.gdp_per_capita))
            .attr("cy", d => yScale(d.clean_fuels_cooking_pct));
            
        updateGlobalHighlights();
    }
 
    updateChart(currentYear);
 
    function stopAnim() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        d3.select("#play-button").text("Play");
    }

    d3.select("#play-button").on("click", function() {
        const button = d3.select(this);
        if (button.text() === "Play") {
            button.text("Pause");
            timer = setInterval(() => {
                currentYear++;
                if (currentYear > 2020) currentYear = 2000;
                updateChart(currentYear);
            }, 600);
        } else {
            stopAnim();
        }
    });

    window.renderAnimatedScatter = function() {
        const filterVal = d3.select("#year-filter").property("value");
        if (filterVal) {
            stopAnim();
            currentYear = +filterVal;
        }
        updateChart(currentYear);
    };

    window.resetVis6Animation = function() {
        stopAnim();
        currentYear = 2000;
        updateChart(currentYear);
    };
}
