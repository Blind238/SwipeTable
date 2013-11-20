var when = require('when');
var Swipe = require('Swipe');

module.exports = function(dataProviderUrl, tableKeys, elem, options){
	"use strict";
	/**
	 * Config
	 *
	 * Use the following format to call SwipeTable
	 *----------------------------------------
	 *	(function(root){
	 *
   *		var restApiUrl = '/api';
   *		var keys = [
   *		    "id", // this is the 'pinned' column
   *		    "time",
   *		    "time2",
   *		    "location",
   *		    "location2"
   *		];
   *		var stElem = document.getElementsByClassName('swipe-table')[0];
	 *
   *		root.SwipeTable = new SwipeTable(restApiUrl, keys, stElem);
	 *
   *	}(this));
	 *----------------------------------------
	 */
	
	//=== Variables ===
	// Check and store parameters
	var dataProvider;
	var keys;
	var elementReference;

	if(typeof dataProviderUrl === 'string'){
		dataProvider = dataProviderUrl;
	}
	else{
		throw new TypeError('First parameter is not a string');
	}

	if(tableKeys instanceof Array){
		keys = tableKeys;
	}
	else{
		throw new TypeError('Second parameter is not an array');
	}

	//TODO: Check element type in different browsers
	//Chrome: 'object'
	//Firefox:
	//IE:
	elementReference = elem;
	var currentIndexElement;

	var swipeReference;
	var deferredContainer = {};
	deferredContainer.deferred = when.defer();

	var tableClass    = 'table';
	tableClass += ' table-condensed';
	var doneTables    = 0;
	var totalTables   = 0;
	var pageSize      = 1;
	var pageAmount;
	var headerHeight  = 50;
	var sortAscending = true;
	var sortColumn;
	var timestamp;

	options = options || {};

	if(typeof options.fullscreen !== 'boolean'){
		// Use default
		options.fullscreen = true;
	}

	//=== Functions ===

	/**
	 * Fetch the viewport size and set the
	 * pageSize(num of rows) based on rowHeight
	 */
	var init = function(){
		var tableHeight;
		var rowHeights;
		var dataDeferred = when.defer();
		var dataTable = createTable();
		var container;

		var stWrap = document.createElement("div");
		stWrap.className = "st-wrap";
		elementReference.appendChild(stWrap);

		if(options.fullscreen){
			tableHeight = viewportHeight();
		}
		else{
			tableHeight = parseInt(elementReference.getBoundingClientRect().height, 10);
		}

		rowHeights = testRowHeights();

		// Add margin for proper spacing of elements
		stWrap.style.marginTop = headerHeight - rowHeights.header + 'px';

		// Remove height for the Header
		tableHeight -= headerHeight;

		//TODO: Remove height for the Controls

		pageSize = Math.floor(tableHeight / rowHeights.body);

		makeRequest(
			dataProvider,
			{},
			dataDeferred.resolver);

		container = elementReference.querySelector('.st-wrap');

		var tablePromise = dataDeferred.promise.then(
			function(value){
				return fillTable(dataTable, value);
			}
		);

		tablePromise.then(
			function(value){
				container.appendChild(value);
				tableDone();
			}
		);

		createHeader();

		var doUpdateHeader = updateHeader.bind(this);

		window.addEventListener('resize', function(){
			doUpdateHeader();
		});

	};

	var viewportHeight = function(){
		// responsejs.com/labs/dimensions/
		var matchMedia = window.matchMedia || window.msMatchMedia;
		var viewportH = (function(win, docElem, mM) {
			var client = docElem.clientHeight,
			    inner = win.innerHeight;
			if (mM && client < inner && true === mM('(min-height:' + inner + 'px)').matches){
				return win.innerHeight;
			}
			else{
				return docElem.clientHeight;
			}
		}(window, document.documentElement, matchMedia));

		return viewportH;
	};

	var testRowHeights = function(){
		var headHeight;
		var bodyHeight;
		var totalHeight;
		var table = document.createElement('table');
		var tHead = document.createElement('thead');
		var tBody = document.createElement('tbody');
		var row   = document.createElement('tr');
		var row2  = document.createElement('tr');
		var head  = document.createElement('th');
		var data  = document.createElement('td');
		var text  = document.createTextNode('text');
		var text2 = document.createTextNode('text');

		var stWrap = elementReference.querySelector('.st-wrap');
		
		table.className = tableClass;
		table.style.visibility = 'hidden';

		head.appendChild(text);
		row.appendChild(head);
		tHead.appendChild(row);
		table.appendChild(tHead);

		data.appendChild(text2);
		row2.appendChild(data);
		tBody.appendChild(row2);
		table.appendChild(tBody);

		stWrap.appendChild(table);

		headHeight = row.getBoundingClientRect().height;

		bodyHeight = row2.getBoundingClientRect().height;

		totalHeight = table.getBoundingClientRect().height;
		//TODO: Determine effects of borders on table size
		//
		stWrap.innerHTML = '';
		
		return {
			header : headHeight,
			body: bodyHeight,
			total: totalHeight 
		};
	};

	var createHeader = function(){
		var i;
		var l;

		var header = document.createElement('div');
		header.className = 'st-header';

		var headerScrollableContainer = document.createElement("div");
		headerScrollableContainer.className = 'st-scrollable';

		for (i = 1, l = keys.length; i < l; i+=1){
			var headerDiv = document.createElement("div");
			headerDiv.appendChild(document.createTextNode(keys[i]));
			headerScrollableContainer.appendChild(headerDiv);
		}

		var headerPinned = document.createElement("div");
		headerPinned.appendChild(document.createTextNode(keys[0]));
		headerPinned.className = 'st-pinned';

		header.appendChild(headerScrollableContainer);
		header.appendChild(headerPinned);
		elementReference.appendChild(header);

		var doSetScrollPosition = updateScroll.setPosition.bind(this);
		var doUpdate = updateScroll.update.bind(this);
		
		headerScrollableContainer.addEventListener('scroll', function(){
			doSetScrollPosition(this.scrollLeft);
			doUpdate();
		});

		updateScroll.setPosition(0);

	};

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
	var makeRequest = function (server, queries, resolver){
		if(typeof server !== 'string'){
			// No server provided, nothing to do here.
			return;
		}
		if(queries.timestamp){

			// If there's a sort parameter, both must be given
			if(queries.sortField || queries.sortAsc){
				if(!queries.sortField || !queries.sortAsc){
					return;
				}

				// If there's a page given, it's a sorted page request
				if(queries.page){
					executeRequest("GET",
					                server +
					                  "?p=" + queries.page +
					                  "&ps=" + pageSize +
					                  "&ts=" + queries.timestamp +
					                  "&sort[field]=" + queries.sortField +
					                  "&sort[asc]=" + queries.sortAsc,
					                resolver);
				}
				// Else, it's a sorted and timestamped first page equest
				else{
					executeRequest("GET",
					                server +
					                  "?ps=" + pageSize +
					                  "&ts=" + queries.timestamp +
					                  "&sort[field]=" + queries.sortField +
					                  "&sort[asc]=" + queries.sortAsc,
					                resolver);
				}
			}
			// So we have timestamp, but no sorting
			else{
				// We need a page parameter to continue
				if(!queries.page){
					// Spec requires a page, nothing more to do here
					return;
				}
				// Make a page request
				executeRequest("GET",
				                server +
				                  "?p=" + queries.page +
				                  "&ps=" + pageSize +
				                  "&ts=" + queries.timestamp,
				                resolver);
			}
		}
		else{
			// No timestamp given, it's a fresh page request
			executeRequest("GET",
			                server +
			                  "?ps=" + pageSize,
			                resolver);
		}
	};

	/**
	 * Executes a request with method, parameters and the table give to next function
	 * @param  {String} method Valid HTTP method eg. GET, POST
	 * @param  {String} url Complete url string (server + parameters)
	 * @param  {Object} table Partial table object
	 */
	var executeRequest = function(method, url, resolver){
		var r = new XMLHttpRequest();
		r.open(method, url, true);
		r.onreadystatechange = function(){
			if(r.readyState !== 4 || r.status !== 200){
				return;
			}
			parseResponse(r.responseText, resolver);
		};
		r.send(null);
	};

	// parseResponse(table, response)
	//  Calls fillTable with table and JSON.parse
	//TODO: Work parseResponse into appropriate function
	var parseResponse = function(response, resolver){
		resolver.resolve(JSON.parse(response));
	};

	/**
	 * Creates a table with appropriate headers(thead).
	 *
	 * Increments totalTables.
	 *
	 * Returns a partial table.
	 */
	var createTable = (function(){
		var tableInstance;

		return function(){

			if(tableInstance){
				totalTables += 1;
				var copy = tableInstance.cloneNode(true);
				return copy;
			}
			else{
				var i;
				var l;
				
				var table = document.createElement("table");
				table.className = tableClass;
				var thead = document.createElement("thead");
				var tr = document.createElement("tr");

				for (i = 0, l = keys.length; i < l; i+=1){
					var th = document.createElement("th");
					th.appendChild(document.createTextNode(keys[i]));
					tr.appendChild(th);
				}

				thead.appendChild(tr);
				table.appendChild(thead);
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
		timestamp = dataSet.timestamp;
		pageAmount = dataSet.pages;
		var numRows = dataSet.data.length;

		if(numRows === 0){
			return;
		}

		var tbody = document.createElement("tbody");
		table.appendChild(tbody);

		var i = 0;
		while (i < numRows){
			var col = dataSet.data[i];
			var tr = document.createElement("tr");
			var colCells = Object.keys(col).length;

			var j = 0;
			while (j < colCells){
				var td = document.createElement("td");
				td.appendChild(document.createTextNode(col[keys[j]]));
				tr.appendChild(td);
				j+=1;
			}

			tbody.appendChild(tr);
			i+=1;
		}
		
		// Make a table container to hold the split elements
		var tableContainer = document.createElement('div');
		// Cloning an element is faster than creating more
		var scrollableContainer = tableContainer.cloneNode(true);
		var pinnedContainer = tableContainer.cloneNode(true);

		// Add classes to the containers
		tableContainer.className = 'st-table-wrap';
		scrollableContainer.className = 'st-scrollable';
		pinnedContainer.className = 'st-pinned';

		// Clone data and attach both to st-pinned and st-scrollable
		var cloned = table.cloneNode(true);
		scrollableContainer.appendChild(table);
		pinnedContainer.appendChild(cloned);

		// Attach to parent
		tableContainer.appendChild(scrollableContainer);
		tableContainer.appendChild(pinnedContainer);

		// Prestyle the table so everything fits nicely when insterted
		if(swipeReference !== undefined){
			swipeReference.prepareForAddition(tableContainer);
		}

		return when.resolve(tableContainer);
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
			if(swipeReference === undefined){
				var doNextPage = nextPage.bind(this);
				var doUpdateHeader = updateHeader.bind(this);
				var doResolveTheResolver = resolveTheResolver.bind(this);

				/* global Swipe */
				swipeReference = new Swipe(elementReference,{
					continuous:false,
					callback: function(currentIndex, element){
						if (currentIndex === element.parentNode.childNodes.length - 1){
							doNextPage();
						}
					},
					transitionEnd: function(currentIndex, element){
						doResolveTheResolver();
						doUpdateHeader(element);
					}
				});
				/* global -Swipe */

				if(doneTables === 1){
					nextPage();
					deferredContainer.deferred.resolver.resolve();
					updateHeader(document.getElementsByClassName('st-table-wrap')[0]);
				}
			}
			else {
				swipeReference.setup();
			}
		}
	};

	var resolveTheResolver = function(){
		deferredContainer.deferred.resolver.resolve();
	};

	/**
	 * Gets position from Swipe.
	 *
	 * Calls createTable(), passes it to makeRequest.
	 */
	var nextPage = function(){
		var pos = swipeReference.getPos() + 1;
		var dataDeferred = when.defer();
		var table;
		var container;
		deferredContainer.deferred = when.defer();

		if(sortColumn === undefined){
			makeRequest(
				dataProvider,
				{
					page: pos + 1,
					timestamp: timestamp,
				},
				dataDeferred.resolver
			);
		}
		else{
			makeRequest(
				dataProvider,
				{
					page: pos + 1,
					sortField: sortColumn,
					sortAsc: sortAscending
				},
				dataDeferred.resolver
			);
		}

		table = createTable();
		container = elementReference.querySelector('.st-wrap');

		var tablePromise = dataDeferred.promise.then(
			function(value){
				return fillTable(table, value);
			}
		);

		when.all([tablePromise, deferredContainer.deferred.promise])
		.then(
			function(values){
				container.appendChild(values[0]);
				tableDone();
			}
		);
		
	};

	/**
	 * Read widths of given element and adjust header spacing
	 * @param  {Object} element Element to read from
	 */
	var updateHeader = function(element){
		var i;

		if (element){
			// Store element so we can reference on window.resize
			currentIndexElement = element;
		}

		// Select the first row of the element
		var tableRow = currentIndexElement.querySelector(".st-scrollable tr");
		var l = tableRow.children.length;
		var cellWidths = [];

		for (i=1; i < l; i+=1){
			var w = tableRow.children[i].getBoundingClientRect().width;
			w = parseInt(w, 10);
			cellWidths.push(w);
		}

		var scrollContainer = elementReference.querySelector('.st-header .st-scrollable');
		
		cellWidths.forEach(function(value, index){
			scrollContainer.children[index].style.width = value + 'px';
		});

	};

	/**
	 * Exposes scroll positions to the outside
	 * and function to update all scrollables.
	 */
	var updateScroll = (function(){
		var position;
		var frameRequested = false;

		return {
			getPosition : function(){
				return position;
			},
			setPosition : function(newPos){
				position = newPos;
			},
			update : function(){
				if(!frameRequested){
					var doUpdateScrollables = updateScroll.updateScrollables.bind(this);
					var doFrameRequested = updateScroll.frameRequested.bind(this);
					frameRequested = true;

					window.requestAnimationFrame(function(){
						doUpdateScrollables();
						doFrameRequested(false);
					});
				}
			},
			updateScrollables : function(){
				var targets = elementReference.querySelector('.st-wrap').getElementsByClassName('st-scrollable');
				
				var i = 0;
				for(i;i<targets.length;i+=1){
					targets[i].scrollLeft = position;
				}
			},
			frameRequested : function(isRequested){
				if (typeof isRequested !== 'undefined' && typeof isRequested === 'boolean'){
					frameRequested = isRequested;
				}
				return frameRequested;
			}
		};
	}());

	var swipeFunc = {
		next : function(){
			if (swipeReference !== undefined)
			{
				swipeReference.next();
			}
		},
		prev : function(){
			if (swipeReference !== undefined)
			{
				swipeReference.prev();
			}
		}
	};

	//=== Logic ===
	init();

	var methods = {
		// Expose test object to test inner functions
		test : {
			init : init,
			makeRequest : makeRequest,
			executeRequest :executeRequest,
			parseResponse : parseResponse,
			createTable : createTable,
			fillTable : fillTable,
			tableDone : tableDone,
			updateHeader : updateHeader,
			updateScroll: updateScroll
		},
		nextPage : nextPage,
		updateHeader : updateHeader,
		getScrollPosition : updateScroll.getPosition,
		setScrollPosition : updateScroll.setPosition,
		updateScrollables : updateScroll.updateScrollables,
		next : swipeFunc.next,
		prev : swipeFunc.prev
	};

	return methods;
};
/* exported SwipeTable */
