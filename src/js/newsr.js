var newsr = (function () {
	// private variables
	var dom, contentList, contentItem;

	var utilities = (function () {
		function saveData(key, data) {
			if (localStorage && localStorage.setItem) {
				localStorage.setItem(key, JSON.stringify(data));
				return true;
			}
			return false;
		}

		function retrieveData(key) {
			if (localStorage && localStorage.getItem && localStorage.getItem(key)) {
				return JSON.parse(localStorage.getItem(key));
			}
			return false;
		}

		function destroyData(key) {
			if (localStorage && localStorage.getItem && localStorage.getItem(key)) {
				localStorage.removeItem(key);
			}
		}

		return {
			saveData: saveData,
			retrieveData: retrieveData,
			destroyData: destroyData
		};
	}());

	var templates = {};
	templates.scanItem = '<h1>{{title}}</h1><h2>{{deck}}</h2><p>{{description}}</p>';
	templates.readingListItem = '{{title}}';

	var contentHistory = (function () {
		var history = {};

		function toString() {
			return JSON.stringify(history);
		}

		function backup() {
			utilities.saveData("contentHistory", history);
		}

		function restore() {
			var data = utilities.retrieveData("contentHistory");
			if (data !== false) {
				history = data;
			}
		}

		function destroy() {
			utilities.destroyData("contentHistory");
		}

		function inHistory(item) {
			return !!history[item.id];
		}

		function updateHistory(item, action) {
			if (!inHistory(item)) {
				history[item.id] = {};
			}
			history[item.id][action] = true;

			backup();
		}

		function skipped(item) {
				updateHistory(item, "skipped");
		}

		function saved(item) {
				updateHistory(item, "saved");
		}

		function read(item) {
				updateHistory(item, "read");
		}

		return {
			toString: toString,
			restore: restore,
			destroy: destroy,
			inHistory: inHistory,
			skipped: skipped,
			saved: saved,
			read: read
		};
	}());

	var listHistory = (function () {
		var history = {};

		function toString() {
			return JSON.stringify(history);
		}

		function backup() {
			utilities.saveData("listHistory", history);
		}

		function restore() {
			var data = utilities.retrieveData("listHistory");
			if (data !== false) {
				history = data;
			}		
		}

		function destroy() {
			utilities.destroyData("listHistory");
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

			backup();
		}

		function skipped(item) {
			updateHistory(item, -0.5);
		}

		function saved(item) {
			updateHistory(item, 0.5);
		}

		function read(item) {
			updateHistory(item, 0.5);
		}

		return {
			toString: toString,
			restore: restore,
			destroy: destroy,
			inHistory: inHistory,
			skipped: skipped,
			saved: saved,
			read: read
		};
	}());

	var readingList = (function () {
		var list = [];

		function toString() {
			return JSON.stringify(list);
		}

		function backup() {
			utilities.saveData("readingList", list);
		}

		function restore() {
			var data = utilities.retrieveData("readingList");
			if (data !== false) {
				list = data;
			}		
		}

		function destroy() {
			utilities.destroyData("readingList");
		}

		function size() {
			return list.length;
		}

		function walk(fn) {
			var i;

			for (i = 0; i < list.length; i++) {
				fn(list[i].item);
			}
		}

		function add(item) {
			list.push({"id": item.id, "item": item});

			backup();
		}

		function remove(item) {
			var i;

			for (i = 0; i < list.length; i++) {
				if (list[i].id === item.id) {
					array.splice(i, 1);
				}
			}

			backup();
		}

		function markRead(item) {
			contentHistory.read(item);
			listHistory.read(item);
			remove(item);
		}

		return {
			toString: toString,
			restore: restore,
			destroy: destroy,
			size: size,
			walk: walk,
			add: add,
			remove: remove,
			markRead: markRead
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
		readingList.add(contentItem);
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
		readingList: readingList,
		init: function () {
			dom = {};
			dom.body = document.getElementsByTagName("body")[0];
			dom.scanItem = document.getElementById("scanitem");
			dom.skipItem = document.getElementById("skipitem");
			dom.saveItem = document.getElementById("saveitem");
			dom.recommendList = document.getElementById("recommendlist");
			dom.readStage = document.getElementById("read");

			contentHistory.restore();
			listHistory.restore();
			readingList.restore();

			return true;
		},
		reset: function () {
			contentHistory.destroy();
			listHistory.destroy();
			readingList.destroy();
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
			var listParts = [], i;

			setMode("read");

			readingList.walk(function (item) {
				listParts.push("<li>" + Mustache.render(templates.readingListItem, item) + "</li>");
			});
			
			dom.readStage.innerHTML = "<ul>" + listParts.join("") + "</ul>";
		}
	};
}());