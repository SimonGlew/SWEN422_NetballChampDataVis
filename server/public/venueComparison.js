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
	$('#venue-comparison-container').empty();

	var margin = {
		top: 50,
		right: 10,
		bottom: 60,
		left: 60
	},
		width = $('#venue-comparison-container').width() - margin.left - margin.right,
		height = 700 - margin.top - margin.bottom;

	var axisHeight = height - 100;

	var svg = d3.select('#venue-comparison-container').append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.bottom + margin.top);

	var g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var y = d3.scaleLinear()
		.range([axisHeight, 0])
		.domain([0, 100])

	var x = d3.scaleBand()
		.range([0, width])
		.padding(0.1)
		.domain(VenueComparison.venueList)

	g.append("g")
		//.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + axisHeight + ")")
		.call(d3.axisBottom(x))
		.selectAll("text")
		.attr("y", 20)
		.attr("x", -10)
		.attr("dy", ".35em")
		.attr("transform", "rotate(50)")
		.style("text-anchor", "start");

	var yAxis = g.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y))

	g.selectAll(".bar")
		.data(VenueComparison.venueData)
		.enter().append("rect")
		.attr("class", function (d) {
			var c = "";
			if (d.home) return "bar-home"
			else return "bar-away"
		})
		.attr("y", function (d) {
			return y(d.win_rate);
		})
		.attr("x", function (d) {
			return x(d.venue);
		})
		.attr("width", x.bandwidth())
		.attr('height', function (d) {
			return axisHeight - y(d.win_rate);
		})
		.on("mouseover", function (d) {
			let x = d3.mouse(this)[0], y = d3.mouse(this)[1]

			let split = d.toolTipVenue.split(',')

			let html = '<div>' +
				'<span class="block"><b>Venue: </b>' + split[0] + '</span >' +
				'<span class="block"><b>At: </b>' + split[1] + '</span >' +
				'<span class="block"><b>Games Played: </b>' + d.played + '</span>' +
				'<span class="block"><b>Games Won: </b>' + d.won + '</span>' +
				'<span class="block"><b>Winrate: </b>' + d.win_rate.toFixed(0) + '%</span>' +
				'</div>'

			showTooltip(x, y, html)
		})
		.on("mouseout", function (d) {
			hideTooltip()
		})

}





