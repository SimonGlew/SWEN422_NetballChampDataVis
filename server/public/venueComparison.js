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

VenueComparison.drawGraph = function () {
	var margin = {
		top: 50,
		right: 10,
		bottom: 60,
		left: 60
	},
		width = $('.venue-comparison-chart').width() - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var svg = d3.select('.venue-comparison-chart').append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.bottom + margin.top);

	var g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var y = d3.scaleLinear()
		.range([height, 0])
		.domain([0, 100])

	var x = d3.scaleOrdinal()
		.range([0, width])
		.domain(VenueComparison.venueList)

	var xAxis = d3.axisBottom(x)
		//.attr("class", "axis axis--x")
		.ticks(VenueComparison.venueList.length)

	var yAxis = g.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y))

	g.selectAll(".bar")
		.data(VenueComparison.venueData)
		.enter().append("rect")
		.attr("class", function (d) {
			var c = "";
			if (d.home) {
				c += " bar-home";
			}
			else {
				c += " bar-away";
			}
			return c;
		})
		.attr("y", function (d) {
			return y(d.win_rate);
		})
		.attr("x", function (d, i) {
			return x(i);
		})
		.attr("width", 20)

}





