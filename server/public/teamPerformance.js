TeamPerformance = {};

TeamPerformance.createGraph = function createGraph(){
  setupSVG();
  setupAxis();
  setupLabels();
}

let showingData = false;

//Fields for storing filtering parameters
let startYear;
let endYear;
let finals;
let team;

TeamPerformance.loadData = function(t, sy, ey, f){
  console.log("Loading Performance data...");
  var url = '/api/get/teamResults?team='+t;
  team = t;
  $.get(url, function(res){
    data = res;
    startYear = sy;
    endYear = ey;
    finals = f;
    if(!showingData){
      createGraph();
    }else{
      removeData();
    }
  })
}

let numTeams = 10;

let width;
let height;
let margin = 50;

function setupSVG(){
  //References for container div and chart svg.
  let container = d3.select("#team-performance-container");
  let svg = d3.select(".team-performance-chart");
  //Set width and height of chart svg
  width = container.node().getBoundingClientRect().width;
  height = 490;
  svg.attr("width", width)
    .attr("height", height);

  //Setup groups for ordering svg elements on z axis.
  svg.append("g").attr("id", "mouse-listeners");
  svg.append("g").attr("id", "markers");
  svg.append("g").attr("id", "g-xLabelAxis");
  svg.append("g").attr("id", "g-yAxis");
  svg.append("g").attr("id", "g-xAxis");
}

let xScale, xAxis;
let yScale, yAxis;

function setupAxis(){
  //Create x axis
  var defaultScale = [2008, 2013];
  xScale = d3.scaleLinear()
    .domain(defaultScale)
    .range([margin, width-margin])

  xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format(".0f"))
    .ticks(0)

  d3.select("#g-xAxis")
    .attr("transform", "translate(0, " + (height - margin) + ")")
    .call(xAxis);

  //Create y axis
  yScale = d3.scaleLinear()
    .domain([1, numTeams])
    .range([margin, height-margin]);

  yAxis = d3.axisLeft(yScale)
    .tickFormat(d3.format(".0f"))
    .ticks(numTeams)

  d3.select("#g-yAxis")
    .attr("transform", "translate(" + margin + ", 0)")
    .call(yAxis);

  //X axis for diplaying ordinal scale for rounds labels
  d3.select("#g-xLabelAxis").attr("class", "xLabelAxis")
    .attr("transform", "translate(0, " + (height - margin) + ")")
    .style("opacity", 0)
}

function setupLabels(){
  //Create y axis label
  d3.select(".team-performance-chart").append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Placing");

  //Create x axis label
  d3.select(".team-performance-chart").append("text")
    .attr("id", "xLabel")
    .attr("transform", "translate(" + (width/2) + " ," + (height - margin/3) + ")")
    .style("text-anchor", "middle")
    .text("Year");

   //Create title
   d3.select(".team-performance-chart").append("text")
    .attr("id", "title")
    .attr("transform", "translate(" + (width/2) + " ," + (margin/3) + ")")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("text-decoration", "underline")
    .text("")
}

//Duration for creating graph
let buildDur = 250;

//Fields for formatting of data
let years;
let yearData;
let yearRounds;
let roundData;
let data;

function createGraph(){
  processData(data, startYear, endYear);
  //Create zomedScale for scaling xAxis when drilling down
  xZoomedScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin, width-margin])
  updateXRoundScale()
  updateAxis();
  updateTitle();
  addMouseListeners(data);
  plotData(data)
  showingData = true;
}

function processData(data, startYear, endYear){
  //Create array of years in dataset
  years = [];
  for(var i = startYear; i <= endYear; i++){
    years.push(i);
  }
  //Number of rounds in each year
  yearRounds = [];
  //List of year objects for plotting data
  yearData = [];
  //List of round objects for plotting data of finer granularity
  roundData = [];
  //Loop over dataset to populate above fields
  for(var i = 0; i < data.length; i++){
    if(data[i].year >= startYear && data[i].year <= endYear){
      yearRounds.push(data[i].rounds.length);
      yearData.push({year: data[i].year, placement: data[i].placement})
      for(var j = 0; j < data[i].rounds.length; j++){
        roundData.push(data[i].rounds[j]);
      }
    }
  }
}

function updateAxis(){
  xScale.domain(d3.extent(years));
  d3.select("#g-xAxis")
    .transition()
    .duration(buildDur)
    .call(xAxis.ticks(years.length))
  //When 3 or less years are being displayed, this gives the incorrect number of ticks. No idea why.
  d3.select("#xLabel")
    .text("Year")
    .transition()
    .duration(buildDur)
    .style("opacity", 1)
}

function updateTitle(){
  d3.select("#title")
    .text(team + " Placings, " + startYear + " - " + endYear)
    .transition()
    .duration(buildDur)
    .style("opacity", 1 )
}

function addMouseListeners(data){
  //Add rectangles for zooming in mouse interaction
  d3.select("#mouse-listeners").selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("class", "zoom-in")
    .attr("x", function(d){
      if(d == years[0]) return margin;
      return xScale(d-0.5);
    })
    .attr("y", margin)
    .attr("width", function(d){
      if(d == years[0] || d == years[years.length-1]) return (width-2*margin)/(years.length-1)/2;
      return (width-2*margin)/(years.length-1);
    })
    .attr("height", height-2*margin)
    .attr("fill", "#FFF")
    .style("cursor", "pointer")
    .on("mouseover", function(){
      d3.select(this).attr("fill", "#F5F5F5")
    })
    .on("mouseout", function(){
      d3.select(this).attr("fill", "#FFF")
    })
    .on("click", zoomIn)

  //Add rectangle for zooming out mouse interaction
  d3.select("#mouse-listeners").append("rect")
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
    .on("click", zoomOut)
    .style("cursor", "pointer")
}

//Line equations for years, zoomed in years, and rounds placements.
let initialLine;
let line;
let roundLine;

function plotData(data){
  //Clipping rectangle for graph
  d3.select("#markers").append("clipPath")
    .attr("id", "marker-clip")
    .append("rect")
      .attr("x", margin)
      .attr("y", 0)
      .attr("width", width-margin*2)
      .attr("height", height-margin)

  //Define line equations
  initialLine = d3.line()
    .x(function(d, i) { return xScale(d.year);})
    .y(function(d) { return yScale(10);})
    .curve(d3.curveCatmullRom)

  line = d3.line()
    .x(function(d, i) { return xScale(d.year); })
    .y(function(d) { return yScale(d.placement); })
    .curve(d3.curveCatmullRom)

  roundLine = d3.line()
    .x(function(d, i) { return xRoundScale(i); })
    .y(function(d) { return yScale(d.placement); })
    .curve(d3.curveCatmullRom)

  //Groups for storing markers and lines
  d3.select("#markers").append("g")
    .attr("id", "line-g")

  d3.select("#markers").append("g")
    .attr("id", "year-markers")

  d3.select("#markers").append("g")
    .attr("id", "round-markers")

  //Plot line on graph
  d3.select("#markers").select("#line-g").append("path")
    .datum(yearData)
    .attr("id", "line")
    .attr("d", initialLine)
    .attr("fill", "none")
    .attr("stroke", "#70a7ff")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .style("pointer-events", "none")
    .attr("clip-path", "url(#marker-clip)")
    .transition()
    .duration(buildDur)
    .attr("d", line);

  //Add markers for each year
  d3.select("#markers").select("#year-markers").selectAll("circle")
    .data(yearData)
    .enter()
    .append("circle")
      .attr("class", "marker")
      .on("mousemove", function (d) {
        var div = $('<div></div>');
        div.append($('<div><span class="smallFont"><b>Year:</b> '+d.year+'</span></div>'))
        div.append($('<div><span class="smallFont"><b>Placing:</b> '+d.placement+'</span></div>'))
        showTooltip(d3.event.x, d3.event.y, div.html());
  		})
      .on("mouseout", function(d){
        hideTooltip()
      })
      .attr("r", 0)
      .attr("cx", function(d, i){
        return xScale(d.year);
      })
      .attr("cy", function(d){
        return yScale(10);
      })
      .attr("fill", "#5697ff")
      .attr("clip-path", "url(#marker-clip)")
      .transition()
      .duration(buildDur)
      .attr("cy", function(d){
        return yScale(d.placement);
      })
      .attr("r", 6);

    //Add markers for each round
    d3.select("#markers").select("#round-markers").selectAll("circle")
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
        .on("mousemove", function (d) {
          var div = $('<div></div>');
          div.append($('<div><span class="smallFont"><b>Round:</b> '+d.round+'</span></div>'))
          div.append($('<div><span class="smallFont"><b>Placing:</b> '+d.placement+'</span></div>'))
          showTooltip(d3.event.x, d3.event.y, div.html());
        })
        .on("mouseout", function(){
          hideTooltip();
        })
        .attr("clip-path", "url(#marker-clip)")
        .style("opacity", 0.8);
}

//Remove data so new data can be visualized.
function removeData(){
  removeAxis();
  removeMouseListeners();
  removeTitle();
  removePlot();
  showingData = false;
}

function removeAxis(){
  d3.select("#g-xAxis")
    .transition()
    .duration(buildDur)
    .call(xAxis.ticks(0))
    .style("opacity", 1)

  d3.select("#g-xLabelAxis")
    .transition()
    .duration(buildDur)
    .style("opacity", 0)

  d3.select("#xLabel")
    .style("opacity", 0)
}

function removeTitle(){
  d3.select("#title")
    .transition()
    .duration(buildDur)
    .style("opacity", 0)
}

function removeMouseListeners(){
  d3.selectAll("#mouse-listeners")
    .selectAll("rect")
    .remove();
}

function removePlot(){
  //Remove markers
  d3.selectAll(".marker")
    .transition()
    .duration(buildDur)
    .attr("cy", yScale(10))
    .attr("r", 0)
    .on("end", function(){
      d3.select(this).remove()
    })

  d3.selectAll(".roundmarker")
    .transition()
    .duration(buildDur)
    .duration(buildDur)
    .attr("cy", yScale(10))
    .attr("r", 0)
    .on("end", function(){
      d3.select(this).remove()
    })

  //Remove line
  d3.select("#line")
    .transition()
    .duration(buildDur)
    .attr("d", initialLine)
    .on("end", function(){
      d3.select("#line").remove()
      createGraph();
    })
}

let yearIndex;

//Function that zooms into a finer level of granularity when clicking on graph.
function zoomIn(year, index){
  yearIndex = index;
  currYear = year;
  var dur = 1000;

  //Update axis to show only one year worth of data
  xZoomedScale.domain([year-1, year])
  updateXRoundScale();
  updateXRoundLabelScale(year);
  xScale.domain(d3.extent(years))

  d3.select("#xLabel")
    .transition()
    .duration(dur/2)
    .style("opacity", 0)

  d3.select("#g-xLabelAxis").transition()
    .call(xLabelAxis);

  xAxis = d3.axisBottom(xZoomedScale)
    .tickFormat(d3.format(".0f"))

  d3.select("#g-xAxis").transition()
    .duration(dur)
    .call(xAxis.ticks(1))

  //Disable mouse events whilst transitioning
  d3.selectAll(".zoom-out")
    .style("pointer-events", "none")
  d3.selectAll(".zoom-in")
    .style("pointer-events", "none")

  //Update marker positions as zooming into data
  d3.selectAll(".marker")
    .transition()
    .duration(dur)
    .attr("cx", function(d){
      return xZoomedScale(d.year);
    })

  //Zoom into line as it changes to show finer granularity of data.
  d3.select("#line")
    .transition()
    .duration(dur)
    .attrTween('d', function (d) {
      return d3.interpolatePath(line(yearData), roundLine(roundData));
    })
    .on("end", function(){
      //Display round markers
      d3.selectAll(".roundmarker")
        .style("fill", function(d, i){
          //Colour point differently if selecting regular or finals only
          if(d.round > yearRounds[yearIndex] - 3){
            if(finals == "finals"){
              return "#33d6ad";
            }
          }else{
            if(finals == "regular"){
              return "#33d6ad"
            }
          }
        })
        .attr("cx", function(d, i){
          return xRoundScale(i);
        })
        .transition()
        .duration(dur/2)
        .attr("r", 4)

      //Transition to rounds x axis
      d3.select("#g-xLabelAxis")
        .transition()
        .duration(dur/2)
        .style("opacity", 1);

      d3.select("#g-xAxis").transition()
        .duration(dur/2)
        .style("opacity", 0);

      d3.select("#xLabel")
        .text("Rounds (" +  year + ")")
        .transition()
        .duration(dur/2)
        .style("opacity", 1)

      //Enable pointer events now transition has ended
      d3.selectAll(".zoom-out")
        .style("pointer-events", "all")
        .style("opacity", 1)

    });
}

//Zoom out back to coarser granularity of data
function zoomOut(){
  var dur = 1000;

  //Disable mouse events while transitioning
  d3.selectAll(".zoom-out")
    .style("pointer-events", "none")
    .style("opacity", 0)
  d3.selectAll(".zoom-in")
    .style("pointer-events", "none")

  //Fade out round markers
  xZoomedScale.domain(d3.extent(years))
  d3.selectAll(".roundmarker")
    .attr("cx", function(d, i){
      return xRoundScale(i);
    })
    .transition()
    .duration(dur/2)
    .attr("r", 0)

  //Update x axis to year view
  xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format(".0f"))
    .ticks(years.length)

  d3.select("#g-xAxis")
    .transition()
    .duration(dur)
    .call(xAxis);

  d3.select("#g-xLabelAxis").transition()
    .duration(dur/2)
    .style("opacity", 0);

  d3.select("#g-xAxis").transition()
    .duration(dur/2)
    .style("opacity", 1);

  //Update position of year markers
  d3.selectAll(".marker")
    .transition()
    .duration(dur)
    .attr("cx", function(d, i){
      return xScale(d.year);
    })
    .on("end", function(){
      //Transition x label back to years
      d3.select("#xLabel")
        .text("Year")
        .transition()
        .duration(dur/2)
        .style("opacity", 1)

      //Enable mouse events as transition has finished
      d3.selectAll(".zoom-in")
        .style("pointer-events", "all")
        .style("opacity", function(){
          return 1;
        })

    })

  //Fade out x label
  d3.select("#xLabel")
    .transition()
    .duration(dur/2)
    .style("opacity", 0)

  //Transition line back to years granularity
  d3.select("#line")
    .transition()
    .duration(dur)
    .attrTween('d', function (d) {
      return d3.interpolatePath(roundLine(roundData), line(yearData));
    })


}

//Fields for managing ordinal scale of rounds for finer granularity
let xRoundScale;
let xRoundAxis;
let xLabelAxis;

let xRoundLabelScale = d3.scaleOrdinal();

//Update ordinal scale for displaying rounds
function updateXRoundLabelScale(year){
  for(var y = 0; y != years.length; y++){
    var i = y;
  }
  var labels = [year - 1];
  var range = [margin];
  for(var j = 1; j < yearRounds[i]; j++){
    labels.push(j);
    range.push(margin + (width-2*margin)/yearRounds[i]*j)
  }
  labels.push(year);
  range.push(width - margin);
  xRoundLabelScale.domain(labels).range(range)
  xLabelAxis = d3.axisBottom(xRoundLabelScale);
}

//Calculate properties required for xRoundLabelScale
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

  xRoundScale = d3.scaleLinear()
    .domain(roundsDomain)
    .range(roundsRange)

  xRoundAxis = d3.axisBottom(xRoundScale)
    .tickFormat(d3.format(".0f"))
    .ticks(16)
}
