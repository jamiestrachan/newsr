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

		// from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
		function shuffleArray(array) {
		    for (var i = array.length - 1; i > 0; i--) {
		        var j = Math.floor(Math.random() * (i + 1));
		        var temp = array[i];
		        array[i] = array[j];
		        array[j] = temp;
		    }
		    return array;
		}

		return {
			saveData: saveData,
			retrieveData: retrieveData,
			destroyData: destroyData,
			shuffleArray: shuffleArray
		};
	}());

	var templates = {};
	templates.scanItem = '<h1>{{title}}</h1><h2>{{deck}}</h2><p>{{description}}</p>';
	templates.readingListItem = '<a href="/read{{url}}">{{title}}</a>';

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
		var history = {
			"news": {},
			"news/world": {},
			"news/canada": {},
			"news/politics": {},
			"news/business": {},
			"news/health": {},
			"news/arts": {},
			"news/technology": {},
			"news/trending": {},
			"sports": {},
			"sports/hockey/nhl": {},
			"sports/football/cfl": {},
			"sports/football/nfl": {},
			"sports/baseball/mlb": {},
			"sports/basketball/nba": {},
			"sports/soccer": {},
			"sports/golf": {},
			"sports/tennis": {},
			"sports/figureskating": {},
			"sports/curling": {},
			"sports/skiing": {},
			"sports/speedskating": {}
		};
		// TO DO: keep track of min and max scores for better recommendations
		var minScore = 0;
		var maxScore = 0;

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

		function recommendLists(count) {
			var ids = Object.keys(history), i, recommendations = [];

			utilities.shuffleArray(ids);

			for (i = 0; i < count; i++) {
				recommendations.push({"label": history[ids[i]].label, "url": ids[i]});
			}

			return recommendations;
		}

		return {
			toString: toString,
			restore: restore,
			destroy: destroy,
			inHistory: inHistory,
			skipped: skipped,
			saved: saved,
			read: read,
			recommendLists: recommendLists
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
			list.unshift({"id": item.id, "item": item});

			backup();
		}

		function remove(item) {
			var i;

			for (i = 0; i < list.length; i++) {
				if (list[i].id === item.id) {
					list.splice(i, 1);
					break;
				}
			}

			backup();
		}

		function markRead(item) {
			contentHistory.read(item);
			listHistory.read(item);
			remove(item);
		}

		function markReadURL(url) {
			var i;

			for (i = 0; i < list.length; i++) {
				if (list[i].item.url === url) {
					markRead(list[i].item);
					break;
				}
			}
		}

		return {
			toString: toString,
			restore: restore,
			destroy: destroy,
			size: size,
			walk: walk,
			add: add,
			remove: remove,
			markRead: markRead,
			markReadURL: markReadURL
		};
	}());

	// private members
	/* Global click handler */
	function handleClicks(e) {
		var clicked = e.target;
		var method = clicked.getAttribute("data-action");

		if (method) {
			switch (method) {
				case "skip":
					skipItem();
					break;
				case "save":
					saveItem();
					break;
				case "done":
					readingList.markReadURL(clicked.getAttribute("data-url"));
					break;
			}
			//e.preventDefault();
		}
	}

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

	function readItem() {

	}

	/* Suggest new list sources to start the scan process again */
	function recommendList() {
		var recommendations, recommendationCount = 3, i, listLinks = [];

		setMode("recommend");

		recommendations = listHistory.recommendLists(recommendationCount);

		for (i = 0; i < recommendationCount; i++) {
			listLinks.push('<li><a href="' + recommendations[i].url + '">' + (recommendations[i].label ? recommendations[i].label : recommendations[i].url) + '</a></li>');
		}

		dom.recommendList.innerHTML = listLinks.join("");
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
			dom.recommendList = document.getElementById("recommendlist");
			dom.readStage = document.getElementById("read");
			dom.readItem = document.getElementById("readitem");

			contentHistory.restore();
			listHistory.restore();
			readingList.restore();

			dom.body.addEventListener("click", handleClicks, false);

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

			reqURL = source.split("/scan/")[1];
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
			var reqURL, doneLink, listParts = [];

			reqURL = source.split("/read/")[1];
			if ( reqURL && reqURL.slice(-1) === "/" ) {
				reqURL = reqURL.substring(0, reqURL.length - 1);
			}

			if (reqURL) {
				setMode("readitem");

				reqURL = "/" + reqURL;

				dom.readItem.innerHTML = '<iframe src="http://www.cbc.ca' + reqURL + '" width="100%" height="750px"></iframe><a href="/read/" data-action="done" data-url="' + reqURL + '">Done</a>';
			} else {
				setMode("read");

				readingList.walk(function (item) {
					listParts.push("<li>" + Mustache.render(templates.readingListItem, item) + "</li>");
				});
				
				dom.readStage.innerHTML = "<ul>" + listParts.join("") + "</ul>";
			}
		}
	};
}());