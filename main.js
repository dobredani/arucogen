var pen_width = 0.01;

	function generateMarkerSvg(width, height, bits) {
		// infill is an integer represnting how many inner pixels to add
		function appendPixel(argsvg, argx, argy, argwidth, argheight, infill) {
			for (xi=infill; xi>=1; xi--){
				$('<rect/>').attr({
					x: pen_width + argx + 0.5 - (xi/infill)/2,
					y: pen_width + argy + 0.5 - (xi/infill)/2,
					width: argwidth - 1 + xi/infill - pen_width * 2,
					height: argheight - 1 + xi/infill - pen_width * 2,
					fill: (xi % 2 != 0) ? 'gray' : 'black'
				}).appendTo(argsvg);
			}
		}

	var svg = $('<svg/>').attr({
		viewBox: '0 0 ' + (width + 2) + ' ' + (height + 2),
		xmlns: 'http://www.w3.org/2000/svg',
		'shape-rendering': 'crispEdges' // disable anti-aliasing to avoid little gaps between rects
	});

	// Background rect
	appendPixel(svg, 1, 0, width + 1, 1, 6);
	appendPixel(svg, 0, height+1, width + 1, 1, 6);
	appendPixel(svg, width+1, 1, 1, height + 1, 6);
	appendPixel(svg, 0, 0, 1, height + 1, 6);

	// "Pixels"
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			if (!bits[i * height + j]){
			appendPixel(svg,  j + 1, i + 1, 1, 1,6);
		}
		}
	}

	return svg;
}

var dict;

function generateArucoMarker(width, height, dictName, id) {
	console.log('Generate ArUco marker ' + dictName + ' ' + id);

	var bytes = dict[dictName][id];
	var bits = [];
	var bitsCount = width *  height;

	// Parse marker's bytes
	for (var byte of bytes) {
		var start = bitsCount - bits.length;
		for (var i = Math.min(7, start - 1); i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}

	return generateMarkerSvg(width, height, bits);
}

var loadDict = $.getJSON('dict.json', function(data) {
	dict = data;
});

$(function() {
	var dictSelect = $('.setup select[name=dict]');
	var markerIdInput = $('.setup input[name=id]');
	var sizeInput = $('.setup input[name=size]');

	function updateMarker() {
		var markerId = Number(markerIdInput.val());
		var size = Number(sizeInput.val());
		var dictName = dictSelect.val();
		var width = Number(dictSelect.find('option:selected').attr('data-width'));
		var height = Number(dictSelect.find('option:selected').attr('data-height'));

		// Wait until dict data is loaded
		loadDict.then(function() {
			// Generate marker
			var svg = generateArucoMarker(width, height, dictName, markerId, size);
			svg.attr({
				width: size + 'mm',
				height: size + 'mm'
			});
			$('.marker').html(svg[0].outerHTML);
			$('.save-button').attr({
				href: 'data:image/svg;base64,' + btoa(svg[0].outerHTML.replace('viewbox', 'viewBox')),
				download: dictName + '-' + markerId + '.svg'
			});
			$('.marker-id').html('ID ' + markerId);
		})
	}

	updateMarker();

	dictSelect.change(updateMarker);
	$('.setup input').on('input', updateMarker);
});
