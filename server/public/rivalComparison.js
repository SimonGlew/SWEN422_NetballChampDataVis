RivalComparison = {};

RivalComparison.loadRivalComparisonRow = function(){
  console.log("Loading Rival data...");
  var team = "Melbourne Vixens";
  var vsTeam = "Central Pulse";
  RivalComparison.loadRivalsTable(team);
  RivalComparison.loadPreviousGamesChart(team, vsTeam);
}

RivalComparison.loadRivalsTable = function(team){
  $.get('api/get/rivalsInformation?team='+team, function(res){
    console.log("Get rival teams info", res);
    if(res){
      var tBody = $('.rival-table-body');
      res.forEach((e) =>{
        var tr = $('<tr></tr>');

        var name = $('<td></td>');
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

  })
}
// /{"round":"1","date":"Saturday 5 April","hTeam":"Central Pulse","score":"33–50","homeScore":33,"awayScore":50,"aTeam":"Melbourne Vixens","venue":"TSB Bank Arena, Wellington","winningTeam":"Melbourne Vixens"}
RivalComparison.loadPreviousGamesChart = function(team, vsTeam){
  $.get('/api/get/previousGamesVS?team='+team+'&vsTeam='+vsTeam, function(res){
    console.log("got prev games info",res);
    // var BWIDTH = 50;
    var data = res;
    var margin = {
      top:10,
      right:10,
      bottom:20,
      left:30
    },
    width = $('.rival-chart-wrapper').width() - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var y = d3.scaleLinear()
    .range([height, 0])
    .domain([-100,100])
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
    .attr("width", width+margin.left + margin.right)
    .attr("height", height+margin.bottom+margin.top);

    var g = svg.append("g")
    .attr("transform", "translate("+margin.left + "," + margin.top+")");


    g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    g.append("g")
    .attr("class", "x axis")
    .append("line")
    .attr("y1", y(0))
    .attr("y2", y(0))
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
          return y(d.pointsDiff);
        }
        else{
          return y(0);
        }
      })
      .attr("x", function(d, i){
        return x(i);
      })
      .attr("width", x.bandwidth())
      .attr("height", function(d){
        return Math.abs(y(d.pointsDiff) - y(0));
      })

  })
}
