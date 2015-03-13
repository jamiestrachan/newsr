var newsr = (function () {
	// private variables
	var dom, contentList, contentItem;

	var templates = {};
	templates.scanItem = '<h1>{{title}}</h1><h2>{{deck}}</h2><p>{{description}}</p>';

	// private members
	/* Do necessary setup when switching modes */
	function setMode(mode) {
		dom.body.className = "mode_" + mode;
	}

	/* Get the JSON of a content list from a data source */
	function getList(source, callback) {
		var jqxhr = $.getJSON("/json/" + source, function(data) {
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
			if (listElement && listElement.contentlist && listElement.contentlist.contentitems && listElement.contentlist.contentitems.length > 0) {
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
			console.log(contentItem);
			dom.scanItem.innerHTML = Mustache.render(templates.scanItem, contentItem);
		} else {
			recommendList();
		}
	}

	/* Suggest new list sources to start the scan process again */
	function recommendList() {
		setMode("recommend");

		dom.recommendList.innerHTML = '<li><a href="/scan/news/business/">Business</a></li><li><a href="/scan/news/arts">Arts</a></li><li><a href="/scan/sports">Sports</a></li>';
	}

	// public variables and members
	return {
		init: function () {
			dom = {};
			dom.body = document.getElementsByTagName("body")[0];
			dom.scanItem = document.getElementById("scanitem");
			dom.scanNext = document.getElementById("scannext");
			dom.recommendList = document.getElementById("recommendlist");
			return true;
		},
		scan: function (source) {
			var reqURL;

			setMode("scan");

			reqURL  = source.split("/scan/")[1];
			if ( reqURL && reqURL.slice(-1) === "/" ) {
				reqURL = reqURL.substring(0, reqURL.length - 1);
			}
			if (!reqURL) {
				reqURL = "news";
			}

			dom.scanNext.onclick = showItem;

			getList(reqURL, function (list) {
				if (list) {
					contentList = list;
					showItem();
				}
			});
		},
		read: function (source) {

			setMode("read");

			return false;
		}
	};
}());