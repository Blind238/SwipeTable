(function(root, undefined) {

  "use strict";


/* SwipeTable main */

// Base object.
var SwipeTable = function(){
	"use strict";

	// Define keys that your table will use,
	// in the order you want them to be displayed.
	// First item is leftmost, last item is rightmost
	//TODO: Fix above sentence
	var keys = [
		"id",
		"time",
		"time2",
		"location",
		"location2"
	];

	// Uncomment/comment last 2 lines for style
	// and height preference
	var tableClass = 'table';
	var rowHeight = 39;
//    tableClass += ' table-bordered';
	tableClass += ' table-condensed'; rowHeight = 33;


	// RESTful provider URI
	// (relative or absolute)
	var dataProvider = "/api";

	//---------------------------------------------
	//== No more configuration beyond this point ==
	//
	//=== Variables ===
	//Initialize other variables
	var doneTables = 0;
	var totalTables = 0;
	var pageSize = 1;
	var sortColumn;
	var sortAscending = true;

	//=== Functions ===

	/**
	 * Fetch the viewport size and set the
	 * pageSize(num of rows) based on rowHeight
	 */
	var init = function(){
		// responsejs.com/labs/dimensions/
		var matchMedia = window.matchMedia || window.msMatchMedia;
		var viewportH = (function(win, docElem, mM) {
			var client = docElem['clientHeight']
				, inner = win['innerHeight'];
			return ( mM && client < inner && true === mM('(min-height:' + inner + 'px)')['matches']
				? win['innerHeight']
				: docElem['clientHeight']
				);
		}(window, document.documentElement, matchMedia));

		// Remove one rowHeight for the header;
		viewportH -= rowHeight;
		pageSize = Math.floor(viewportH / rowHeight);
	}

	/**
	 * Takes an object that contains:
	 * REQ* server: address of the API
	 * REQ* pageSize
	 * REQ* table: container to attach the results to
	 *    * page
	 *    * timestamp
	 *    * sortField
	 *    * sortAsc
	 * Items marked with REQ are required or the request will fail.
	 *
	 * Fetches according to parameters given
	 * and gives results + table to parseResponse.
	 * @param {Object}queries Object containing quieries
	 */
	var makeRequest = function (queries){
		if(!queries.server){
			console.log("No server provided to makeRequest, not making request");
			return
		}
		console.log("Making request to "+ queries.server+ ".");
		var r = new XMLHttpRequest();
		if(queries.timestamp){
			if(queries.sortField || queries.sortAsc){
				if(!queries.sortField || !queries.sortAsc){
					console.log("Missing sort parameter");
					return
				}

				if(queries.page){
					r.open("GET", queries.server + "?p=" + queries.page + "&ps=" + pageSize + "&ts=" + queries.timestamp + "sort[field]=" + queries.sortField + "&sort[asc]=" + queries.sortAsc, true);
					r.onreadystatechange =  function(){
						if(r.readyState !== 4 || r.status !== 200){
							console.log("Request went sour");
							return;
						}
						console.log("Request successful.");
						parseResponse(queries.table, r.responseText);
					};
				}
				else{
					r.open("GET", queries.server + "?ps=" + pageSize + "&ts=" + queries.timestamp + "sort[field]=" + queries.sortField + "&sort[asc]=" + queries.sortAsc, true);
					r.onreadystatechange =  function(){
						if(r.readyState !== 4 || r.status !== 200){
							console.log("Request went sour");
							return;
						}
						console.log("Request successful.");
						parseResponse(queries.table, r.responseText);
					};
				}
			}
			else{
				if(!queries.page){
					console.log("Missing page, not according to spec.");
					return;
				}
				// No sorting, must be page request
				r.open("GET", queries.server + "?p=" + queries.page + "&ps=" + pageSize + "&ts=" + queries.timestamp, true);
				r.onreadystatechange =  function(){
					if(r.readyState !== 4 || r.status !== 200){
						console.log("Request went sour");
						return;
					}
					console.log("Request successful.");
					parseResponse(queries.table, r.responseText);
				};
			}
		}
		else{
			// No timestamp, fresh request
			r.open("GET", queries.server + "?&ps=" + pageSize, true);
			r.onreadystatechange =  function(){
				if(r.readyState !== 4 || r.status !== 200){
					console.log("Request went sour");
					return;
				}
				console.log("Request successful.");
				parseResponse(queries.table, r.responseText);
			};
		}
		r.send(null);
	};

	// parseResponse(table, response)
	//  Calls fillTable with table and JSON.parse
	//TODO: Work parseResponse into appropriate function
	var parseResponse = function(table, response){
		console.log("Parsing response.");
		fillTable(table, JSON.parse(response));
	};

	/**
	 * Creates a table with appropriate headers(thead).
	 *
	 * Increments totalTables.
	 *
	 * Returns a partial table.
	 */
	var createTable = (function(){
		console.log("Creating Table.");
		var tableInstance;
		return function(){
			if(tableInstance){
				console.log("Giving table instance");
				totalTables += 1;
				var copy = tableInstance.cloneNode(true);
				return copy;
			}
			else{
				console.log("Creating new Table");
				var i = 0;
				var table = document.createElement("table");
				table.className = tableClass;
				var thead = document.createElement("thead");
				var tr = document.createElement("tr");

				for (i; i < keys.length; i+=1){
					var th = document.createElement("th");
					th.appendChild(document.createTextNode(keys[i]));
					tr.appendChild(th);
				}

				thead.appendChild(tr);
				table.appendChild(thead);
				console.log("Table created.");
				tableInstance = table.cloneNode(true);
				totalTables += 1;
				return table;
			}
		};
	}());

	/**
	 * Goes through dataSet and attaches rows to
	 * the table reference, then attaches the
	 * table to the container in the DOM.
	 *
	 * Calls tableDone() when done.
	 * @param table Partial table to fill
	 * @param dataSet Parsed data to fill with
	 */
	var fillTable = function(table, dataSet){
		console.log("Filling table.");

		var numRows = dataSet.length;
		if(numRows === 0){
			return;
		}

		var tbody = document.createElement("tbody");
		table.appendChild(tbody);

		var i = 0;
		while (i < numRows){
			var col = dataSet[i];
			var tr = document.createElement("tr");
			var colCells = Object.keys(col).length;

			var j = 0;
			while (j < colCells)
			{
				var td = document.createElement("td");
				td.appendChild(document.createTextNode(col[keys[j]]));
				tr.appendChild(td);
				j+=1;
			}

			tbody.appendChild(tr);
			i+=1;
		}
		var container = document.getElementsByClassName('st-wrap')[0];
		var tableContainer = document.createElement('div');
		var scrollableContainer = tableContainer.cloneNode(true);
		var pinnedContainer = tableContainer.cloneNode(true);
		tableContainer.className = 'st-table-wrap';
		scrollableContainer.className = 'st-scrollable';
		pinnedContainer.className = 'st-pinned';
		var cloned = table.cloneNode(true);
		scrollableContainer.appendChild(table);
		pinnedContainer.appendChild(cloned);
		tableContainer.appendChild(scrollableContainer);
		tableContainer.appendChild(pinnedContainer);
		if(window.mySwipe !== undefined){
			window.mySwipe.prepareForAddition(tableContainer);
		}
		container.appendChild(tableContainer);
		tableDone();
	};

	/**
	 *  Increments doneTables and executes if equal to totalTables.
	 *  Checks if mySwipe is made and if it isn't,
	 *  makes it and gives arguments to mySwipe.
	 *  If it's the first table to be finished,
	 *  sets up the next one to be fetched and placed,
	 *  also updates the header.
	 *
	 *  If mySwipe was already made, calls mySwipe.setup.
	 */
	var tableDone = function(){
		doneTables += 1;
		if (doneTables === totalTables){
			if(window.mySwipe === undefined){
				window.mySwipe = Swipe(document.getElementsByClassName('swipe-table')[0],{
					continuous:false,
					callback: function(currentIndex, element){
						if (currentIndex === element.parentNode.childNodes.length - 1){
							console.log("fetching next item");
							SwipeTable.nextPage();
						}
					},
					transitionEnd: function(currentIndex, element){
						SwipeTable.updateHeader(element);
					}
				});
				if(doneTables === 1){
					nextPage();
					updateHeader(document.getElementsByClassName('st-table-wrap')[0]);
				}
			}
			else {
				window.mySwipe.setup();
			}
		}
	};

	/**
	 * Gets position from mySwipe.
	 *
	 * Calls createTable(), passes it to makeRequest.
	 */
	var nextPage = function(){
		var pos = window.mySwipe.getPos() + 1;

		var table = createTable();
		if(sortColumn === undefined){
			makeRequest({
				table: table ,
				server: dataProvider,
				page: pos + 1,
				timestamp: 10
			});
		}
		else{
			makeRequest({
				table: table,
				server: dataProvider,
				page: pos + 1,
				sortField: sortColumn,
				sortAsc: sortAscending
			});
		}
	};

	/**
	 * Copy the given element,
	 * paste it in the header container and attach onscroll listener,
	 * execute updateScroll calls when appropriate to update positions.
	 * @param element
	 */
	var updateHeader = function(element){
		var copy = element.cloneNode(true);
		var header = document.getElementsByClassName('swipe-table-header')[0];
		header.innerHTML = '';
		copy.removeAttribute('style');
		copy.removeAttribute('data-index');
		header.appendChild(copy);

		var scrollable = header.getElementsByClassName('st-scrollable')[0];
		if (scrollable){
			scrollable.onscroll = function(){
				console.log("Scrolling is happening!");
				SwipeTable.setScrollPosition(this.scrollLeft);
				SwipeTable.updateScrollables();
			};

			var pos = SwipeTable.getScrollPosition();
			if (pos !== undefined){
				scrollable.scrollLeft = pos;
				SwipeTable.updateScrollables();
			}
			else{
				SwipeTable.setScrollPosition(0);
			}
		}
	};

	/**
	 * Exposes scroll positions to the outside
	 * and function to update all scrollables.
	 */
	var updateScroll = (function(){
		var position;
		console.log("Entered updateScroll");

		return {
			getPosition : function(){
				console.log("Getting position " + position);
				return position;
			},
			setPosition : function(newPos){
				console.log("Setting position " + newPos);
				position = newPos;
			},
			updateScrollables : function(){
				console.log("Updating scrollables");
				var targets = document.getElementsByClassName('st-wrap')[0].getElementsByClassName('st-scrollable');
				var i = 0;
				for(i;i<targets.length;i+=1){
					targets[i].scrollLeft = position;
				}
			}
		}
	}());

	//=== Logic ===
	init();

	var dataTable = createTable();
	console.log("dataProvider === " + dataProvider);
	makeRequest({
		table: dataTable,
		server: dataProvider
	});
	updateHeader(dataTable);

	var methods = {
		nextPage : nextPage,
		updateHeader : updateHeader,
		getScrollPosition : updateScroll.getPosition,
		setScrollPosition : updateScroll.setPosition,
		updateScrollables : updateScroll.updateScrollables
	};

	return methods;
};


// Version.
SwipeTable.VERSION = '0.0.0';


// Export to the root, which is probably `window`.
root.SwipeTable = SwipeTable;


}(this));
