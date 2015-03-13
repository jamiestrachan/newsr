/*var newsr = function () {



	return {
		scan: scan,
		read: read
	};
}();*/

var newsr = {};





newsr.init = function () {
	return true;
};

newsr.scan = function ( source ) {
	var reqURL = source.split("/scan/")[1];
	if ( reqURL && reqURL.slice(-1) === "/" ) {
		reqURL = reqURL.substring(0, reqURL.length - 1);
	}
	if (!reqURL) {
		reqURL = "news";
	}

	var jqxhr = $.getJSON( "/json/" + reqURL, function(data) {
		var listElement;
		if (data.slots) {
			for (var i = 0; i < data.slots.length; i++) {
				if (data.slots[i].name === "main") {
					for (var j = 0; j < data.slots[i].elements.length; j++) {
						if (data.slots[i].elements[j].type === "topstories") {
							listElement = data.slots[i].elements[j];
						}
					}
				}
			}
		}
		console.log(data);
		console.log(listElement);
	})
	.fail(function() {
		console.log( "error" );
	});
};