$(document).ready(function(){
  console.log("Hello world, this is meee, life can beeee, for anyone");
  init();
})

function init(){
  console.log("init");
  setYearSlider();
  setTeamSelect();
  setReload();
  reload();



}

function setTeamSelect(){
  // $("#team").selectmenu();
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
    range:true,
    min:2008,
    max:2014,
    step:1,
    values:[2008,2009],
    animate:true
  });
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
  var endYear = sliderVals[1] -1;
  var format = $('#format').val();

  console.log("setting title");
  $('#team-title').text(team + ', years ' + startYear + " to "+sliderVals[1]);
  console.log("loading charts with ...",team,startYear,sliderVals[1]);

  TeamPerformance.loadPerformanceRow();
  RivalComparison.loadRivalComparisonRow(team,startYear,endYear,format);
  VenueComparison.loadVenueComparisonRow();
}
