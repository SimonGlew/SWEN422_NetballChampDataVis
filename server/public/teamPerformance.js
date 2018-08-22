TeamPerformance = {};

TeamPerformance.loadPerformanceRow = function(){
  console.log("Loading Performance data...");
  team = "Waikato Bay of Plenty Magic"
  $.get('/api/get/teamResults?team='+team, function(res){
    createGraph(res);
  })
}

function createGraph(data){
  var zoomedIn = false;

  //TODO load this from data

  console.log(data)
  years = [];
  yearRounds = [];
  yearData = [{year: 2007, placement: 5}];
  roundData = [];
  for(var i = 0; i < data.length; i++){
    years.push(data[i].year);
    yearRounds.push(data[i].rounds.length);
    yearData.push({year: data[i].year, placement: data[i].placement})
    for(var j = 0; j < data[i].rounds.length; j++){
      roundData.push(data[i].rounds[j]);
    }
  }

  console.log("Year Data", yearData)

  console.log("Years: " + years)
  console.log("Year Rounds: " + yearRounds)
  console.log(roundData);
  //TODO load this from data? Maybe?
  numTeams = 10;
  numRounds = 17;

  var currYear = 0;

  //References for container div and chart svg.
  let container = d3.select("#team-performance-container");
  let svg = d3.select(".team-performance-chart");


  //Set width and height of chart svg
  let width = container.node().getBoundingClientRect().width;
  let height = 400;

  //Set svg width to container width and arbitrary height
  svg.attr("width", width)
    .attr("height", height);

  //Define groups for svg elements (Useful for defining z-order)
  let gMouseListener = svg.append("g").attr("id", "mouse-listeners");
  let gMarkers = svg.append("g").attr("id", "markers");
  let gXAxis = svg.append("g");
  let gXLabelAxis = svg.append("g");
  let gYAxis = svg.append("g");

  //Set scales
  let margin = 50;

  let xScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin, width-margin])

  let xZoomedScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin, width-margin])

  let xRoundScale;

  let xRoundLabelScale = d3.scaleOrdinal();

  function updateXRoundLabelScale(i){
    year = years[i]
    var labels = [year - 1];
    var range = [margin];
    console.log(yearRounds)
    for(var j = 1; j < yearRounds[i]; j++){
      labels.push(j);
      range.push(margin + (width-2*margin)/yearRounds[i]*j)
    }
    labels.push(year);
    range.push(width - margin);
    console.log("labels", labels);
    console.log("range", range);
    xRoundLabelScale.domain(labels).range(range)
    console.log(xRoundLabelScale);
  }

  function updateXRoundScale(){
    var roundsRange = [];
    var roundsDomain = [];
    var roundCount = -1;
    for(var i = 0; i <= years.length; i++){
      var year = i < years.length ? years[i] - 1 : years[i-1];
      roundsRange.push(xZoomedScale(year));
      roundsDomain.push(roundCount);
      roundCount += yearRounds[i];
    }
    console.log("ROUNDS DOMAIN:", roundsDomain)
    console.log("ROUNDS RANGE:", roundsRange)

    xRoundScale = d3.scaleLinear()
      .domain(roundsDomain)
      .range(roundsRange)
  }
  updateXRoundScale()

  let yScale = d3.scaleLinear()
    .domain([1, 10])

    .range([margin, height-margin]);

  //Add axis
  gXAxis.attr("class", "xAxis")
    .attr("transform", "translate(0, " + (height - margin) + ")");

  gXLabelAxis.attr("class", "xLabelAxis")
    .attr("transform", "translate(0, " + (height - margin) + ")")
    .style("opacity", 0)

  let xAxis = d3.axisBottom(xZoomedScale)
    .tickFormat(d3.format(".0f"))
    .ticks(years.length)

  let xLabelAxis = d3.axisBottom(xRoundLabelScale);

  // let xRoundAxis = d3.axisBottom(xRoundScale)
  //   .tickFormat(d3.format(".0f"))
  //   .ticks(16)

  gYAxis.attr("class", "yAxis")
    .attr("transform", "translate(" + margin + ", 0)");

  let yAxis = d3.axisLeft(yScale)
    .tickFormat(d3.format(".0f"))
    .ticks(numTeams)

  gXAxis.call(xAxis);
  gYAxis.call(yAxis);


  //Add rectangles for zooming in mouse interaction
  gMouseListener.selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("class", "zoom-in")
    .attr("x", function(d){
      if(d == years[0]){
        return margin;
      }
      return xScale(d-0.5);
    })
    .attr("y", margin)
    .attr("width", function(d){
      if(d == years[0] || d == years[years.length-1]){
        return (width-2*margin)/(years.length-1)/2;
      }
      return (width-2*margin)/(years.length-1);
    })
    .attr("height", height-2*margin)
    .attr("fill", "#FFF")
    .style("cursor", "pointer")
    .on("mouseover", function(){2008
      d3.select(this).attr("fill", "#F5F5F5")
    })
    .on("mouseout", function(){
      d3.select(this).attr("fill", "#FFF")
    })
    .on("click", function(d, i){
      console.log("Zoom into " + d + " (index " + i + ")")

      currYear = i;
      var dur = 1000;

      xZoomedScale.domain([d-1, d])
      updateXRoundScale();
      updateXRoundLabelScale(i);
      xScale.domain(d3.extent(years))


      gXLabelAxis.transition()
        .call(xLabelAxis);

      gXAxis.transition()
        .duration(dur)
        .call(xAxis.ticks(1))

      d3.selectAll(".marker")
        .transition()
        .duration(dur)
        .attr("cx", function(d){
          return xZoomedScale(d.year);
        })



      d3.select("#line")
        .transition()
        .duration(dur)
        .attrTween('d', function (d) {
          return d3.interpolatePath(line(yearData), roundLine(roundData));
        })
        .on("end", function(){
          d3.selectAll(".roundmarker")
            .attr("cx", function(d, i){
              return xRoundScale(i);
            })
            .transition()
            .duration(dur/2)
            .attr("r", 4)

          gXLabelAxis.transition()
            .duration(dur/2)
            .style("opacity", 1);

          gXAxis.transition()
            .duration(dur/2)
            .style("opacity", 0);

        });



      d3.select(".zoom-out")
        .style("pointer-events", "all")
        .style("opacity", 1)
      d3.select(this)
        .style("pointer-events", "none")
        .style("opacity", 0)
    })

    //Add rectangles for zooming out mouse interaction
    gMouseListener.append("rect")
      .attr("class", "zoom-out")
      .attr("x", margin)
      .attr("y", margin)
      .attr("width", width-2*margin)
      .attr("height", height-2*margin)
      .attr("fill", "#FFF")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .on("mouseover", function(){
        d3.select(this).attr("fill", "#F5F5F5")
      })
      .on("mouseout", function(){
        d3.select(this).attr("fill", "#FFF")
      })
      .on("click", function(d){
        console.log("Zoom out")
        var dur = 1000;

        xZoomedScale.domain(d3.extent(years))
        d3.selectAll(".roundmarker")
          .attr("cx", function(d, i){
            return xRoundScale(i);
          })
          .transition()
          .duration(dur/2)
          .attr("r", 0)
        gXAxis.transition()
          .duration(dur)
          .call(xAxis.ticks(years.length));

        gXLabelAxis.transition()
          .duration(dur/2)
          .style("opacity", 0);

        gXAxis.transition()
          .duration(dur/2)
          .style("opacity", 1);

        d3.selectAll(".marker")
          .transition()
          .duration(dur)
          .attr("cx", function(d, i){
            return xScale(d.year);
          })

          d3.select("#line")
            .transition()
            .duration(dur)
            .attrTween('d', function (d) {
              return d3.interpolatePath(roundLine(roundData), line(yearData));
            })


        d3.selectAll(".zoom-in")
          .style("pointer-events", "all")
          .style("opacity", 1)
        d3.select(this)
          .style("pointer-events", "none")
          .style("opacity", 0)
      })
      .style("cursor", "pointer")


    //Add markers for data
    gMarkers.append("clipPath")
      .attr("id", "marker-clip")
      .append("rect")
        .attr("x", margin)
        .attr("y", 0)
        .attr("width", width-margin*2)
        .attr("height", height-margin)

    var line = d3.line()
      .x(function(d, i) { return xScale(d.year); })
      .y(function(d) { return yScale(d.placement); })
      .curve(d3.curveCatmullRom)

    var roundLine = d3.line()
      .x(function(d, i) { return xRoundScale(i); })
      .y(function(d) { return yScale(d.placement); })
      .curve(d3.curveCatmullRom)


    gMarkers.append("g")
      .attr("id", "line-g")

    gMarkers.append("g")
      .attr("id", "year-markers")

    gMarkers.append("g")
      .attr("id", "round-markers")


    gMarkers.select("#line-g").append("path")
      .datum(yearData)
      .attr("id", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#70a7ff")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("clip-path", "url(#marker-clip)");

    gMarkers.select("#year-markers").selectAll("circle")
      .data(yearData)
      .enter()
      .append("circle")
        .attr("class", "marker")
        .attr("r", 6)
        .attr("cx", function(d, i){
          console.log(xScale(d.year))
          return xScale(d.year);
        })
        .attr("cy", function(d){
          return yScale(d.placement);
        })
        .attr("fill", "#5697ff")
        .attr("clip-path", "url(#marker-clip)");

      gMarkers.select("#round-markers").selectAll("circle")
        .data(roundData)
        .enter()
        .append("circle")
          .attr("class", "roundmarker")
          .attr("r", 0)
          .attr("cx", function(d, i){
            return xRoundScale(i);
          })
          .attr("cy", function(d){
            return yScale(d.placement);
          })
          .attr("fill", "#5697ff")
          .attr("clip-path", "url(#marker-clip)")
          .style("opacity", 0.8);


}
