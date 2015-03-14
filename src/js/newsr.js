var newsr = (function () {
	// private variables
	var dom, contentList, contentItem;

	var templates = {};
	templates.scanItem = '<h1>{{title}}</h1><h2>{{deck}}</h2><p>{{description}}</p>';

	var contentHistory = (function () {
		var history = {};

		function toString() {
			return JSON.stringify(history);
		}

		function restore() {
			if (localStorage && localStorage.getItem && localStorage.getItem("contentHistory")) {
				history = JSON.parse(localStorage.getItem("contentHistory"));
			}			
		}

		function inHistory(item) {
			return !!history[item.id];
		}

		function updateHistory(item, action) {
			if (!inHistory(item)) {
				history[item.id] = {};
			}
			history[item.id][action] = true;

			if (localStorage && localStorage.setItem) {
				localStorage.setItem("contentHistory", JSON.stringify(history));
			}			
		}

		return {
			toString: toString,
			restore: restore,
			inHistory: inHistory,
			skipped: function (item) {
				updateHistory(item, "skipped");
			},
			saved: function (item) {
				updateHistory(item, "saved");
			},
			read: function (item) {
				updateHistory(item, "read");
			}
		};
	}());

	var listHistory = (function () {
		var history = {};

		function toString() {
			return JSON.stringify(history);
		}

		function restore() {
			if (localStorage && localStorage.getItem && localStorage.getItem("listHistory")) {
				history = JSON.parse(localStorage.getItem("listHistory"));
			}			
		}

		function extractKey(item) {
			var i, keyParts = [];

			for (i = 0; i < item.departments.length; i++) {
				keyParts.push(item.departments[i].name);
			}

			return keyParts.join("/");
		}

		function inHistory(item) {
			return !!history[extractKey(item)];
		}

		function updateHistory(item, modifier) {
			if (!inHistory(item)) {
				history[extractKey(item)] = {};
				history[extractKey(item)].label = item.departments[item.departments.length - 1].label;
				history[extractKey(item)].score = 0;
			}
			history[extractKey(item)].score += modifier;

			if (localStorage && localStorage.setItem) {
				localStorage.setItem("listHistory", JSON.stringify(history));
			}
		}

		return {
			toString: toString,
			restore: restore,
			inHistory: inHistory,
			skipped: function (item) {
				updateHistory(item, -0.5);
			},
			saved: function (item) {
				updateHistory(item, 0.5);
			},
			read: function (item) {
				updateHistory(item, 0.5);
			}
		};
	}());

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
			if (contentHistory.inHistory(contentItem)) {
				showItem();
			} else {
				dom.scanItem.innerHTML = Mustache.render(templates.scanItem, contentItem);
			}
		} else {
			recommendList();
		}
	}

	function skipItem() {
		contentHistory.skipped(contentItem);
		listHistory.skipped(contentItem);
		showItem();
	}

	function saveItem() {
		contentHistory.saved(contentItem);
		listHistory.saved(contentItem);
		showItem();
	}

	/* Suggest new list sources to start the scan process again */
	function recommendList() {
		setMode("recommend");

		dom.recommendList.innerHTML = '<li><a href="/scan/news/business/">Business</a></li><li><a href="/scan/news/arts">Arts</a></li><li><a href="/scan/sports">Sports</a></li>';
	}

	// public variables and members
	return {
		contentHistory: contentHistory,
		listHistory: listHistory,
		init: function () {
			dom = {};
			dom.body = document.getElementsByTagName("body")[0];
			dom.scanItem = document.getElementById("scanitem");
			dom.skipItem = document.getElementById("skipitem");
			dom.saveItem = document.getElementById("saveitem");
			dom.recommendList = document.getElementById("recommendlist");

			contentHistory.restore();
			listHistory.restore();

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

			dom.skipItem.onclick = skipItem;
			dom.saveItem.onclick = saveItem;

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