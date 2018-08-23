VenueComparison = {};

VenueComparison.venueList = []
VenueComparison.venueData = []

VenueComparison.loadVenueComparisonRow = function (team, startDate, endDate, finals) {
	console.log("Loading Venue data...");
	VenueComparison.getData(team, startDate, endDate, finals)
}

VenueComparison.getData = function (team, startDate, endDate, finals) {
	$.get('/api/get/getVenues?team=' + team + '&startYear=' + startDate + '&endYear=' + endDate + "&finals=" + finals, function (res) {
		VenueComparison.venueList = res.map(r => r.venue)
		VenueComparison.venueData = res

		VenueComparison.drawGraph()
	})
}

VenueComparison.drawGraph = function(){
	
}





