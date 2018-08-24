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

		VenueComparison.drawGraph(team)
	})
}

VenueComparison.drawGraph = function (team) {
	$('#venue-comparison-container').empty();

	var margin = {
		top: 50,
		right: 10,
		bottom: 60,
		left: 60
	},
		width = $('#venue-comparison-container').width() - margin.left - margin.right,
		height = 700 - margin.top - margin.bottom;

	var axisHeight = height - 200;

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
		.attr("y", 0)
		.attr("x", 10)
		.attr("dy", ".35em")
		.attr("transform", "rotate(90)")
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
		.attr("x", function (d) {
			return x(d.venue);
		})
		.attr("y", function(d) {
			return y(0);
		})
		.attr("height", 0)
		.attr("width", x.bandwidth())
		.on("mouseover", function (d) {
			let x = d3.event.x, y = d3.event.y

			let split = d.toolTipVenue.split(',')

			let html = '<div>' +
				'<span class="block smallFont"><b>Venue: </b>' + split[0] + '</span >' +
				(split.length == 2 ? '<span class="block smallFont"><b>At: </b>' + split[1] + '</span ></br>' : '</br>') +
				(d.home ? '<span class="block smallFont">Home Venue</span>' : '<span class="block smallFont">Away Venue</span>') +
				'<span class="block smallFont"><b>Games Played: </b>' + d.played + '</span>' +
				'<span class="block smallFont"><b>Games Won: </b>' + d.won + '</span>' +
				'<span class="block smallFont"><b>Winrate: </b>' + d.win_rate.toFixed(0) + '%</span>' +
				'</div>'

			showTooltip(x, y, html)
		})
		.on("mouseout", function (d) {
			hideTooltip()
		})
		.transition()
		.duration(500)
		.attr("y", function (d) {
			return y(d.win_rate);
		})
		.attr('height', function (d) {
			return axisHeight - y(d.win_rate);
		})


	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0)
		.attr("x", - (height / 2) + 50)
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Win Rate (%)");

	svg.append("text")
		.attr("id", "yLabel")
		.attr("transform", "translate(" + ((width + margin.left) / 2) + " ," + (height + margin.top + margin.bottom / 1.5) + ")")
		.style("text-anchor", "middle")
		.text("Venue");

	svg.append("text")
		.attr("x", ((width + margin.left + margin.right) / 2))
		.attr("y", (margin.top / 2))
		.attr("text-anchor", "middle")
		.style("font-size", "16px")
		.style("text-decoration", "underline")
		.text('Venues that ' + team + ' played at');

	g.selectAll('.winrate_label')
		.data(VenueComparison.venueData)
		.enter()
		.append('text')
		.attr("y", function (d) {
			return y(d.win_rate) - 5;
		})
		.attr("x", function (d) {
			return x(d.venue);
		})
		.attr("width", x.bandwidth())
		.attr("dx", x.bandwidth() / 2)
		.attr("text-anchor", "middle")
		.style('opacity', 0)
		.text(function (d) {
			return d.win_rate.toFixed(0) + '%'
		})
		.transition()
			.delay(250)
			.duration(250)
			.style('opacity', 1)

}
