$(document).ready(function(){
  console.log("Hello world, this is meee, life can beeee, for anyone");
  init();
})

function init(){
  console.log("init");
  setYearSlider();
  TeamPerformance.loadPerformanceRow();
  RivalComparison.loadRivalComparisonRow();
  VenueComparison.loadVenueComparisonRow();


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
