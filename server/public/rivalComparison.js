RivalComparison = {};
RivalComparison.team = "";

RivalComparison.loadRivalComparisonRow = function(team, startYear, endYear, finals){
  console.log("Loading Rival data...");



  RivalComparison.team = team;
  RivalComparison.startYear = startYear;
  RivalComparison.endYear = endYear;
  RivalComparison.finals = finals;
  // var vsTeam = "Central Pulse";
  $('.rival-chart-wrapper').empty();
  RivalComparison.loadRivalsTable(RivalComparison.team, startYear, endYear, finals);
  // RivalComparison.loadPreviousGamesChart(team, vsTeam, 2008, 2013, "all");
}

RivalComparison.loadRivalsTable = function(team, startYear, endYear, finals){
  var url = '/api/get/rivalsInformation?team='+team+ '&startYear='+startYear + '&endYear='+endYear + "&finals="+finals;
  $.get(url, function(res){
    console.log("Get rival teams info", res);
    if(res){
      var tBody = $('.rival-table-body');
      tBody.empty();
      res.forEach((e) =>{
        var tr = $('<tr class="unselectable"></tr>');
        tr.addClass("clickable-row");
        tr.css("cursor", "pointer")

        var name = $('<td class="td-name"></td>');
        name.text(e.name);

        var winrate = $('<td></td>');
        winrate.text(e.winrateVS);

        var pointsDiff = $('<td></td>');
        pointsDiff.text(e.totalPointsDiff);

        tr.append(name);
        tr.append(winrate);
        tr.append(pointsDiff);
        tBody.append(tr);

      })
    }

    tBody.on('click', '.clickable-row', (e)=>{
      // $(".clickable-row").removeClass('bg-info');
      $(e.target.parentNode).addClass('clicked-row').siblings().removeClass('clicked-row');
      var teamName = $(e.target.parentNode).find('.td-name').text();
      RivalComparison.loadPreviousGamesChart(RivalComparison.team,teamName,RivalComparison.startYear,RivalComparison.endYear,RivalComparison.finals);
    })

  })
}


// /{"round":"1","date":"Saturday 5 April","hTeam":"Central Pulse","score":"33–50","homeScore":33,"awayScore":50,"aTeam":"Melbourne Vixens","venue":"TSB Bank Arena, Wellington","winningTeam":"Melbourne Vixens"}
RivalComparison.loadPreviousGamesChart = function(team, vsTeam, startYear, endYear, finals){
  $.get('/api/get/previousGamesVS?team='+team+'&vsTeam='+vsTeam+'&startYear='+startYear + '&endYear='+endYear+"&finals="+finals, function(res){
    console.log("got prev games info",res);
    $('.rival-chart-wrapper').empty();
    //TeamA Points Differential VS TeamB, startYear - endYear
    // var BWIDTH = 50;

    var title = team +" Points Differential VS "+vsTeam + ", years "+startYear +" - "+(endYear+1);
    var data = res;
    var margin = {
      top:50,
      right:10,
      bottom:60,
      left:60
    },
    width = $('.rival-chart-wrapper').width() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var y = d3.scaleLinear()
    .range([height, 0])
    .domain([-50,50])
    // .domain(d3.extent(data, function(d){
    //   return d.pointsDiff;
    // }))

    console.log(y(1))


    var x = d3.scaleBand().rangeRound([0,width]).padding(0.1)
    .domain(data.map((d, i)=>{return i;}))

    // var xAxisScale = d3.scaleLinear()
    //   .domain([0,data.length])
    //   .range([0,data.length])

    var svg = d3.select('.rival-chart-wrapper').append("svg")
    .attr("class", "previous-games-chart")
    .attr("width", width+margin.left + margin.right)
    .attr("height", height+margin.bottom+margin.top);

    var g = svg.append("g")
    .attr("transform", "translate("+margin.left + "," + margin.top+")");


    g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(function(d){return d+1}));

    g.append("g")
    .attr("class", "x axis")
    .append("line")
    .attr("y1", height - y(0))
    .attr("y2", height - y(0))
    .attr("x2", width);

    g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Points diff");

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", function(d){
        var c = "";
        if(d.pointsDiff < 0){
          c+="bar negative";
        }
        else{
          c+="bar positive";
        }
        if(d.wasHome){
          c+=" bar-home";
        }
        else{
          c+=" bar-away";
        }
        return c;
      })
      .attr("y", function(d){
        if(d.pointsDiff > 0){
          return y(0);
        }
        else{
          return y(0);
        }
      })
      .attr("x", function(d, i){
        return x(i);
      })
      .attr("width", x.bandwidth())
      .transition()
      .attr("y", function(d){
        if(d.pointsDiff > 0){
          return y(d.pointsDiff);
        }
        else{
          return y(0);
        }
      })
      .attr("height", function(d){
        var h = Math.abs(y(d.pointsDiff) - y(0));
        return h;
      })


      svg.append("text")
        .attr("x", (width/2))
        .attr("y", (margin.top /2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(title);

        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0)
          .attr("x", - (height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Points Differential");

        svg.append("text")
          .attr("id", "yLabel")
          .attr("transform", "translate(" + ((width+margin.left)/2) + " ," + (height + margin.top + margin.bottom/1.5) + ")")
          .style("text-anchor", "middle")
          .text("Previous Game Number");


  })
}
