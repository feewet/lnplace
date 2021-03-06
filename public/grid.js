/* eslint-disable */

// gridData
// create a new grid with colors from the server
// void -> d3 data object
function refreshGrid() {
	var rawData;
	var data = new Array();
	var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
	var ypos = 1;
	var width = 50;
	var height = 50;
	var click = 0;

	// make get request for colors
	var url = "http://ln.raceplace.org/colors";
	d3.json(url, function(error, response) {
    	//console.log(response);
    	rawData = response.colors;

    	console.log(rawData);

		// iterate for rows	
		for (var row = 0; row < 16; row++) {
			data.push( new Array() );
			
			// iterate for cells/columns inside rows
			for (var column = 0; column < 16; column++) {
				data[row].push({
					x: xpos,
					y: ypos,
					width: width,
					height: height,
					click: click,
					color: rawData[row*16+column]
				})
				// increment the x position. I.e. move it over by 50 (width variable)
				xpos += width;
			}
			// reset the x position after a row is complete
			xpos = 1;
			// increment the y position for the next row. Move it down 50 (height variable)
			ypos += height;	

		}
		setGrid(data);
	});
}

function setGrid(gridData) {
	// I like to log the data to the console for quick debugging
	console.log(gridData);

	d3.select("#grid svg").remove();

	var grid = d3.select("#grid")
		.append("svg")
		.attr("width","810px")
		.attr("height","810px");
		
	var row = grid.selectAll(".row")
		.data(gridData)
		.enter().append("g")
		.attr("class", "row");

	var column = row.selectAll(".square")
		.data(function(d) { return d; })
		.enter().append("rect")
		.attr("class", "square")
		.attr("x", function(d) { return d.x; })
		.attr("y", function(d) { return d.y; })
		.attr("width", function(d) { return d.width; })
		.attr("height", function(d) { return d.height; })
		.style("fill", function(d) { return d.color})
		.style("stroke", "#222")
		.on('click', function(d, col, row) {
	       	d.click = !d.click
	       	console.log(arguments);

	       	if(selectedCell != null){

	       		var prevSquare = grid.selectAll(".square").filter(function(d2,i){
  					return i == selectedCell;
  				});
  				prevSquare.style('fill',function(d){
  					return d.color;
  				});

	       	}

  			var width = Math.sqrt(grid.selectAll('.square')[0].length);

   			var newSquare = grid.selectAll(".square").filter(function(d2,i){
  				return i == row*width+col;
  			});
  			newSquare.style('fill',$("#colorPicker .colorpicker_hex input").val());

  			selectedCell = row*width+col;

   			d3.select("#row").text(row);
   			d3.select("#col").text(col);
      
		});
		
		if(selectedCell != null){
			var prevSquare = grid.selectAll(".square").filter(function(d2,i){
			   return i == selectedCell;
		   });
		   prevSquare.style('fill',$("#colorPicker .colorpicker_hex input").val());
		}
}

$('#colorPicker').ColorPicker({flat: true});

refreshGrid();

var selectedCell = null;
function getInvoice() {
	const row = parseInt(d3.select("#row").text());
	const col = parseInt(d3.select("#col").text());
	const index = selectedCell;
	const color = '#' + $("#colorPicker .colorpicker_hex input").val().toUpperCase();
	d3.xhr('http://ln.raceplace.org/invoice')
    .header("Content-Type", "application/json")
    .post(
        JSON.stringify({index, color}),
        function(err, rawData){
            var data = JSON.parse(rawData.response);
			console.log("invoice response", data);
			new QRious({
				element: document.getElementById('qr'),
				value: data.payment_request,
				size: 250
			});
			d3.select("#payreq").text(data.payment_request);
        }
    );
}

const event_source = new EventSource('/listen');
event_source.onmessage = function (e) {
	refreshGrid();
}

window.setInterval(function(){
	refreshGrid();
  }, 2000);
