var newsr = (function () {
	// private variables
	var contentList, contentItem;

	// private members
	/* Get the JSON of a content list from a data source */
	function getList(source, callback) {
		var jqxhr = $.getJSON( "/json/" + source, function(data) {
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
			if (listElement.contentlist && listElement.contentlist.contentitems && listElement.contentlist.contentitems.length > 0) {
				callback(listElement.contentlist.contentitems);
			} else {
				callback(false);
			}
		})
		.fail(function() {
			callback(false);
		});
	}

	/* Grab the first item off contentList and display. If no items in contentList, move on to recommendList */
	function showItem() {
		if (contentList.length > 0) {
			contentItem = contentList.shift();
		} else {
			recommendList();
		}
	}

	/* Suggest new list sources to start the scan process again */
	function recommendList() {

	}

	// public variables and members
	return {
		init: function () {
			return true;
		},
		scan: function (source) {
			var reqURL = source.split("/scan/")[1];
			if ( reqURL && reqURL.slice(-1) === "/" ) {
				reqURL = reqURL.substring(0, reqURL.length - 1);
			}
			if (!reqURL) {
				reqURL = "news";
			}

			getList(reqURL, function (list) {
				if (list) {
					contentList = list;
					showItem();
				}
			});
		},
		read: function (source) {
			return false;
		}
	};
}());