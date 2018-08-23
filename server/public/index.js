$(document).ready(function(){
  console.log("Hello world, this is meee, life can beeee, for anyone");
  init();
})

function init(){
  console.log("init");
  setYearSlider();
  setTeamSelect();
  setFormat();
  // setReload();
  setupTeamPerformance()
  reload();


}

function showTooltip(left, top, html) {
  $('#tooltip').css('left', left)
  $('#tooltip').html(html)

  let height = $('#tooltip').height()
  $('#tooltip').css('top', (top-height))

  d3.select('#tooltip')
    .style("z-index", 1000)
    .transition()
    .duration(200)
    .style("opacity", 1);
}

function hideTooltip() {
  d3.select('#tooltip')
    .transition()
    .duration(200)
    .style("opacity", 0)
    .on("end", function(d){
      d3.select('#tooltip')
        .style("z-index", -1)
    })



}

function setTeamSelect(){
  $("#team").change(function(e){
    reload();
  })
}

function setFormat(){
  $('#format').change(function(e){
    reload();
  })
}

function setupTeamPerformance(){
  TeamPerformance.createGraph();
  // TeamPerformance.loadPerformanceRow(team,startYear,endYear,format);
}


function setYearSlider(){
  var handleA = $(".year-handle.lower-handle");
  var handleB = $(".year-handle.upper-handle");

  $('.year-slider').slider({
    create: function(e, ui){
        handleA.text(2008);
        handleB.text(2009);

    },
    slide: function(e, ui){
      if($(ui.handle).hasClass("upper-handle")){
        handleB.text(ui.value);

      }
      else{
        handleA.text(ui.value);

      }
    },
    stop: function(e,ui){
      setHandleTimer(handleA.text(), handleB.text());

    },
    range:true,
    min:2008,
    max:2013,
    step:1,
    values:[2008,2009],
    animate:true
  });
}

function setHandleTimer(lower, higher){
  var i = setTimeout((res)=>{
    var handleA = $(".year-handle.lower-handle");
    var handleB = $(".year-handle.upper-handle");
    if(handleA.text() === lower && handleB.text() === higher){
      reload();
    }
  },250)
}

function setReload(){
  $('.reload-button').click(function(e){
    reload();
  })
}

function reload(){
  var team = $('#team').val();
  var sliderVals = $('.year-slider').slider("values");
  var startYear = sliderVals[0];
  var endYear = sliderVals[1];
  var format = $('#format').val();

  console.log("setting title");
  $('#team-title').text(team + ', years ' + startYear + " to "+sliderVals[1]);
  console.log("loading charts with ...",team,startYear,sliderVals[1]);

  RivalComparison.loadRivalComparisonRow(team,startYear,endYear,format);
  VenueComparison.loadVenueComparisonRow(team,startYear,endYear,format);
  TeamPerformance.loadData(team,startYear,endYear,format);
}
