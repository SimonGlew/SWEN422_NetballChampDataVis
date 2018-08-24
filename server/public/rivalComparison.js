RivalComparison = {};
RivalComparison.team = "";

//Method will load the table and rival graph data for the given options
RivalComparison.loadRivalComparisonRow = function(team, startYear, endYear, finals){
  console.log("Loading Rival data...");

  //store info
  RivalComparison.team = team;
  RivalComparison.startYear = startYear;
  RivalComparison.endYear = endYear;
  RivalComparison.finals = finals;

  //remove any old graph and table
  $('.rival-chart-wrapper').empty();
  //load table information
  RivalComparison.loadRivalsTable(RivalComparison.team, startYear, endYear, finals);

  //set up click listener for the rivals checkbox
  $('#rival-check').click(function(e){
    if($('#rival-check').prop("checked")){
      $('.non-rival').hide();

    }
    else{
      $('.non-rival').show();
    }
  })
}

//load table data
RivalComparison.loadRivalsTable = function(team, startYear, endYear, finals){
  //first get the info from api, then smash into table
  var url = '/api/get/rivalsInformation?team='+team+ '&startYear='+startYear + '&endYear='+endYear + "&finals="+finals;
  $.get(url, function(res){
    console.log("Get rival teams info", res);
    if(res){
      var tBody = $('.rival-table-body');
      tBody.empty();
      res.forEach((e, index) =>{
        //for each team, make a row
        var tr = $('<tr class="unselectable"></tr>');
        tr.addClass("clickable-row");
        tr.css("cursor", "pointer")

        if(e.isRival){
          tr.addClass("rival");
        }
        else{
          if($('#rival-check').prop("checked")){
            tr.hide();
          }
          tr.addClass("non-rival");
        }

        var name = $('<td class="td-name"></td>');
        name.text(e.name);

        var winrate = $('<td></td>');
        winrate.text(e.winrateVS);

        var pointsDiff = $('<td></td>');
        pointsDiff.text(e.totalPointsDiff);

        var gamesPlayed = $('<td></td>');
        gamesPlayed.text(e.gamesPlayed);
        var gamesWon = $('<td></td>');
        gamesWon.text(e.gamesWon);

        tr.append(name);
        tr.append(winrate);
        tr.append(pointsDiff);
        tr.append(gamesPlayed);
        tr.append(gamesWon);
        tBody.append(tr);
        if(index === 0){
          //set the first row as the clicked row initially, and load up the graph for it
          tr.addClass("clicked-row");
          RivalComparison.loadPreviousGamesChart(RivalComparison.team,e.name,RivalComparison.startYear,RivalComparison.endYear,RivalComparison.finals);
        }
      })
    }

    tBody.on('click', '.clickable-row', (e)=>{
      //set click listeners for all rows
      $(e.target.parentNode).addClass('clicked-row').siblings().removeClass('clicked-row');
      var teamName = $(e.target.parentNode).find('.td-name').text();
      RivalComparison.loadPreviousGamesChart(RivalComparison.team,teamName,RivalComparison.startYear,RivalComparison.endYear,RivalComparison.finals);
    })

  })


}

//build the actual chart
RivalComparison.loadPreviousGamesChart = function(team, vsTeam, startYear, endYear, finals){
  $.get('/api/get/previousGamesVS?team='+team+'&vsTeam='+vsTeam+'&startYear='+startYear + '&endYear='+endYear+"&finals="+finals, function(res){
    console.log("got prev games info",res);
    $('.rival-chart-wrapper').empty();

    //first make title text, set margins and get width and height qvaialabel
    var title = team +" Points Differential VS "+vsTeam + ", years "+startYear +" - "+(endYear);
    var data = res;
    var margin = {
      top:50,
      right:10,
      bottom:60,
      left:60
    },
    width = $('.rival-chart-wrapper').width() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    //create scales
    var y = d3.scaleLinear()
    .range([height, 0])
    .domain([-50,50])

    var x = d3.scaleBand().rangeRound([0,width]).padding(0.1)
    .domain(data.map((d, i)=>{return i;}))

    //add svg object convering full are
    var svg = d3.select('.rival-chart-wrapper').append("svg")
    .attr("id", "previous-games-chart")
    .attr("width", width+margin.left + margin.right)
    .attr("height", height+margin.bottom+margin.top);

    //add graphics pane we will draw chart on within the svg
    var g = svg.append("g")
    .attr("transform", "translate("+margin.left + "," + margin.top+")");

    //add axis to chart, adding two x axis, one at 0 and one at bottom of graph as we go negative
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

    //now draw bars, shifting bars with negative values below 0
    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .style("stroke", 'none')
      .style("stroke-width","5px")
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
      .on("mousemove", function(d){
        var x = d3.event.x;
        var y = d3.event.y;
        RivalComparison.generateTooltip(x,y,d.date,d.venue,d.round,d.wasHome?team:vsTeam);
      })
      .on("mouseout",function(d){
        console.log("MOUSE OUT");

        hideTooltip();
      })
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

      //add title and axis labels
      svg.append("text")
        .attr("x", ((width + margin.left + margin.right)/2))
        .attr("y", (margin.top /2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
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

//used to generate the tolltip as seen int he mouse on functions of each rect
RivalComparison.generateTooltip = function(x,y, date, venue, round, homeTeam){
  var div = $('<div></div>');
  div.append($('<div class="rival-tooltip"><span class="smallFont"><b>Date:</b> '+date+'</span></div>'))
  div.append($('<div class="rival-tooltip"><span class="smallFont"><b>Venue:</b> '+venue+'</span></div>'))
  div.append($('<div class="rival-tooltip"><span class="smallFont"><b>Round:</b> '+round+'</span></div>'))
  div.append($('<div class="rival-tooltip"><span class="smallFont"><b>Home Team:</b> '+homeTeam+'</span></div>'))
  showTooltip(x,y,div.html());
}
