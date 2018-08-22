TeamPerformance = {};

TeamPerformance.loadPerformanceRow = function(){
  console.log("Loading Performance data...");

  var zoomedIn = false;

  //TODO load this from data
  years = [2008, 2009, 2010, 2011, 2012, 2013]

  //TODO load this from data? Maybe?
  numTeams = 10;
  numRounds = 17;

  var currYear = 0;


  data = [];
  roundsData = [];

  for(var i = 0; i < years.length; i++){
    yearObj = {
      year: years[i],
      placement: Math.floor(Math.random()*10) + 1,
      rounds: []
    }
    for(var j = 1; j <= numRounds; j++){
      yearObj.rounds.push({
        round: j,
        placement: Math.floor(Math.random()*10) + 1
      })
      roundsData.push({  round: j , placement: Math.floor(Math.random()*10) + 1 })
    }
    data.push(yearObj)
  }

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
  let gYAxis = svg.append("g");

  //Set scales
  let margin = 50;

  let xScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin, width-margin])

  let xRoundScale = d3.scaleLinear()
    .domain([0, roundsData.length])
    .range([margin, width-margin])

  let yScale = d3.scaleLinear()
    .domain([1, 10])
    .range([margin, height-margin]);

  //Add axis
  gXAxis.attr("class", "xAxis")
    .attr("transform", "translate(0, " + (height - margin) + ")");

  let xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format(".0f"))
    .ticks(years.length)

  let xRoundAxis = d3.axisBottom(xRoundScale)
    .tickFormat(d3.format(".0f"))
    .ticks(16)

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
      console.log("Zoom into " + d)

      currYear = i;

      // xScale.domain([d-1, d])
      // xRoundScale.domain([(currYear-1)*17, (currYear-1)*17 + 17])

      gXAxis.transition()
        .duration(300)
        .call(xAxis.ticks(1))

      d3.selectAll(".marker")
        .transition()
        .attr("cx", function(d, i){
          return xScale(years[i]);
        })

      d3.select("#line")
        .transition()
        .attr("d", line)
        .on("end", function(){
          d3.select(this)
            .transition()
            .duration(1000)
            .attrTween('d', function (d) {
              console.log(d)
              return d3.interpolatePath(line(d), roundLine(roundsData));
            });
        })
      // d3.select("#line")
      //   .datum(roundPlacing)
      //   .transition()
      //   .duration(1000)
      //   .attrTween('d', function () {
      //     currYear = d;
      //     return d3.interpolatePath(line(yearlyPlacing), roundLine(roundPlacing[d]));
      //   });

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
        // xScale.domain(d3.extent(years))
        gXAxis.transition().call(xAxis.ticks(years.length));
        d3.selectAll(".marker")
          .transition()
          .attr("cx", function(d, i){
            return xScale(d.year);
          })

          d3.select("#line")
            .transition()
            .attrTween('d', function (d) {
              console.log(d)
              return d3.interpolatePath(roundLine(roundsData), line(d));
            });


        // d3.select("#line")
        //   .datum(yearlyPlacing)
        //   .transition()
        //


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
      .curve(d3.curveCardinal)

    var roundLine = d3.line()
      .x(function(d, i) { return xRoundScale(i); })
      .y(function(d) { return yScale(d.placement); })
      .curve(d3.curveCardinal)

    gMarkers.append("path")
      .datum(data)
      .attr("id", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#70a7ff")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("clip-path", "url(#marker-clip)");

    gMarkers.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
        .attr("class", "marker")
        .attr("r", 6)
        .attr("cx", function(d, i){
          return xScale(d.year);
        })
        .attr("cy", function(d){
          return yScale(d.placement);
        })
        .attr("fill", "#5697ff")
        .attr("clip-path", "url(#marker-clip)");





}
