var when = require('when');

module.exports = function(dataProviderUrl, tableKeys, elem, options){
  "use strict";
  /**
   * Config
   *
   * Use the following format to call SwipeTable
   *----------------------------------------
   *  (function(root){
   *
   *    var restApiUrl = '/api';
   *    var keys = [
   *        "id", // this is the 'pinned' column
   *        "time",
   *        "time2",
   *        "location",
   *        "location2"
   *    ];
   *    var stElem = document.getElementsByClassName('swipe-table')[0];
   *
   *    root.SwipeTable = new SwipeTable(restApiUrl, keys, stElem);
   *
   *  }(this));
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
  var scrollbarHeight = 5;
  var controlHeight = 50;
  var sortAscending = true;
  var sortColumn;
  var timestamp;

  var headerScrollbar;
  var mainScrollbar;

  var controls;

  options = options || {};

  if(typeof options.fullscreen !== 'boolean'){
    // Use default
    options.fullscreen = true;
  }

  function Swipe(container, options) {

    // utilities
    var noop = function() {}; // simple no operation function
    var offloadFn = function(fn) { setTimeout(fn || noop, 0); }; // offload a functions execution

    // check browser capabilities
    var browser = {
      addEventListener: !!window.addEventListener,
      touch: ('ontouchstart' in window),
      transitions: (function(temp) {
        var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
        for ( var i in props ){
          if (temp.style[ props[i] ] !== undefined){
            return true;
          }
          return false;
        }
      })(document.createElement('swipe'))
    };

    // quit if no root element
    if (!container){
      return;
    }
    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;

    function setup() {

      // cache slides
      slides = element.children;
      length = slides.length;


      // create an array to store current positions of each slide
      slidePos = new Array(slides.length);

      // determine width of each slide
      width = container.getBoundingClientRect().width || container.offsetWidth;

      element.style.width = (slides.length * width) + 'px';

      // stack elements
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];

        slide.style.width = width + 'px';
        slide.setAttribute('data-index', pos);

        if (browser.transitions) {
          slide.style.left = (pos * -width) + 'px';
          move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
        }

      }


      if (!browser.transitions){
        element.style.left = (index * -width) + 'px';
      }

      container.style.visibility = 'visible';

    }

    function prev() {

      if (index){
        slide(index-1);
      }
    }

    function next() {

      if (index < slides.length - 1){
        slide(index+1);
      }
    }

    function circle(index) {

      // a simple positive modulo using slides.length
      return (slides.length + (index % slides.length)) % slides.length;

    }

    function slide(to, slideSpeed) {

      // do nothing if already on requested slide
      if (index == to){
        return;
      }

      if (browser.transitions) {

        var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

        var diff = Math.abs(index-to) - 1;

        // move all the slides between index and to in the right direction
        while (diff--){
          move( circle((to > index ? to : index) - diff - 1), width * direction, 0);
        }

        to = circle(to);

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);

      } else {

        to = circle(to);
        animate(index * -width, to * -width, slideSpeed || speed);
        //no fallback for a circular continuous if the browser does not accept transitions
      }

      index = to;
      offloadFn(options.callback && options.callback(index, slides[index]));
    }

    function move(index, dist, speed) {

      translate(index, dist, speed);
      slidePos[index] = dist;

    }

    function translate(index, dist, speed, direct) {
      var slide;
      if (direct){
        slide = direct;
      }
      else{
        slide = slides[index];
      }

      var style = slide && slide.style;

      if (!style){
        return;
      }

      style.webkitTransitionDuration =
      style.MozTransitionDuration =
      style.msTransitionDuration =
      style.OTransitionDuration =
      style.transitionDuration = speed + 'ms';

      style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
      style.msTransform =
      style.MozTransform =
      style.OTransform = 'translateX(' + dist + 'px)';

    }

    function animate(from, to, speed) {

      // if not an animation, just reposition
      if (!speed) {

        element.style.left = to + 'px';
        return;

      }

      var start = Date.now();

      var timer = setInterval(function() {

        var timeElap = Date.now() - start;

        if (timeElap > speed) {

          element.style.left = to + 'px';

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          clearInterval(timer);
          return;

        }

        element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

      }, 4);

    }

    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

    // setup event capturing
    var events = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend': offloadFn(this.transitionEnd(event)); break;
          case 'resize': offloadFn(setup.call()); break;
        }

        if (options.stopPropagation){
          event.stopPropagation();
        }

      },
      start: function(event) {

        var touches = event.touches[0];

        // measure start values
        start = {

          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,

          // store time to determine touch duration
          time: Date.now()

        };

        // used for testing first move event
        isScrolling = undefined;

        // reset delta and end measurements
        delta = {};

        // attach touchmove and touchend listeners
        element.addEventListener('touchmove', this, false);
        element.addEventListener('touchend', this, false);

      },
      move: function(event) {

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 1 || event.scale && event.scale !== 1){
          return;
        }

        if (options.disableScroll){
          event.preventDefault();
        }

        var touches = event.touches[0];

        // measure change in x and y
        delta = {
          x: touches.pageX - start.x,
          y: touches.pageY - start.y
        };

        // determine if scrolling test has run - one time test
        if ( typeof isScrolling == 'undefined') {
          isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
        }

        // if user is not trying to scroll vertically
        if (!isScrolling) {

          // prevent native scrolling
          event.preventDefault();

          // increase resistance if first or last slide

            delta.x =
              delta.x /
                ( (!index && delta.x > 0 ||           // if first slide and sliding left
                    index == slides.length - 1 &&     // or if last slide and sliding right
                    delta.x < 0                       // and if sliding at all
                ) ?
                ( Math.abs(delta.x) / width + 1 )      // determine resistance level
                : 1 );                                 // no resistance if false

            // translate 1:1
            translate(index-1, delta.x + slidePos[index-1], 0);
            translate(index, delta.x + slidePos[index], 0);
            translate(index+1, delta.x + slidePos[index+1], 0);

        }

      },
      end: function() {

        // measure duration
        var duration = Date.now() - start.time;

        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
              Number(duration) < 250 &&         // if slide duration is less than 250ms
              Math.abs(delta.x) > 20 ||         // and if slide amt is greater than 20px
              Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        var isPastBounds =
              !index && delta.x > 0 ||                       // if first slide and slide amt is greater than 0
               index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // if not scrolling vertically
        if (!isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {

                move(index-1, -width, 0);

              move(index, slidePos[index]-width, speed);
              move(circle(index+1), slidePos[circle(index+1)]-width, speed);
              index = circle(index+1);

            } else {
                move(index+1, width, 0);

              move(index, slidePos[index]+width, speed);
              move(circle(index-1), slidePos[circle(index-1)]+width, speed);
              index = circle(index-1);

            }

            options.callback && options.callback(index, slides[index]);

          } else {

              move(index-1, -width, speed);
              move(index, 0, speed);
              move(index+1, width, speed);

          }

        }

        // kill touchmove and touchend event listeners until touchstart called again
        element.removeEventListener('touchmove', events, false);
        element.removeEventListener('touchend', events, false);

      },
      transitionEnd: function(event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        }

      }

    };

    // trigger setup
    setup();


    // add event listeners
    if (browser.addEventListener) {

      // set touchstart event on element
      if (browser.touch){
        element.addEventListener('touchstart', events, false);
      }

      if (browser.transitions) {
        element.addEventListener('webkitTransitionEnd', events, false);
        element.addEventListener('msTransitionEnd', events, false);
        element.addEventListener('oTransitionEnd', events, false);
        element.addEventListener('otransitionend', events, false);
        element.addEventListener('transitionend', events, false);
      }

      // set resize event on window
      window.addEventListener('resize', events, false);

    } else {

      window.onresize = function () { setup(); }; // to play nice with old IE

    }

    // expose the Swipe API
    return {
      setup: function() {

        setup();

      },
      slide: function(to, speed) {

        slide(to, speed);

      },
      prev: function() {

        prev();

      },
      next: function() {

        next();

      },
      getPos: function() {

        // return current index position
        return index;

      },
      getNumSlides: function() {

        // return total number of slides
        return length;
      },
      prepareForAddition: function(newElement) {

        // style an addition to the slides
        translate(null, width , 0, newElement);
        newElement.style.width = width + 'px';
        newElement.style.left = (length * -width) + 'px';

        element.style.width = (function(){
          var w = parseInt(element.style.width, 10) / length;
          w *= (length + 1);
          return (w + 'px');
        }());
      }

    };

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
      document.body.parentElement.style.height = '100%';
      document.body.style.height = '100%';
      elementReference.style.height = '100%';
      tableHeight = viewportHeight();
    }
    else{
      tableHeight = parseInt(elementReference.getBoundingClientRect().height, 10);
    }

    rowHeights = testRowHeights();

    // Add margin for proper spacing of elements
    stWrap.style.marginTop = headerHeight - rowHeights.header + 'px';

    // Remove height for other elements
    tableHeight -= headerHeight;

    tableHeight -= scrollbarHeight;

    tableHeight -= controlHeight;

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
        updateMainScrollbar(0);
        updateHeaderScrollbar();
      }
    );

    createHeader();

    var doUpdateHeader = updateHeader.bind(this);
    var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);

    window.addEventListener('resize', function(){
      doUpdateHeader();
      doUpdateHeaderScrollbar();
    });

    mainScrollbar = createScrollbar();
    headerScrollbar = createScrollbar();

    elementReference.appendChild(mainScrollbar);
    elementReference.querySelector('.st-header .st-scrollable').appendChild(headerScrollbar);

    controls = createControls();

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

  var createScrollbar = function(){
    var bar = document.createElement('div');
    var indicator = document.createElement('div');
    bar.className = 'st-scrollbar';
    bar.appendChild(indicator);
    return bar;
  };

  var createControls = function(){
    var i,l;

    var buttonGlyphs  = ['<<', '<', '>', '>>'];
    var events = ['first', 'previous', 'next', 'last'];
    var buttons = [];

    var container = document.createElement('div');
    container.className = 'st-controls';

    var eventHandlers = {
      first: function(element){
        var clickEvent = function(){
          goToPage(0);
        };

        var doClickEvent = clickEvent.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      previous: function(element){
        var doClickEvent = swipeFunc.prev.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      next: function(element){
        var doClickEvent = swipeFunc.next.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      last: function(element){
        var clickEvent = function(){
          goToPage(pageAmount);
        };

        var doClickEvent = clickEvent.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      }
    };

    var createButton = function(glyph){
      var button = document.createElement('div');
      button.appendChild(document.createTextNode(glyph));
      buttons.push(button);
    };

    var attachButton = function(index){
      container.appendChild(buttons[index]);
    };

    var attachEvent = function(index){
      eventHandlers[ events[index] ]( buttons[index] );
    };

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      createButton(buttonGlyphs[i]);
      attachButton(i);
    }

    elementReference.appendChild(container);

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      attachEvent(i);
    }

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
        var doUpdate = update.bind(this);
        var doResolveTheResolver = resolveTheResolver.bind(this);

        swipeReference = new Swipe(elementReference,{
          continuous:false,
          callback: function(currentIndex, element){
            if (currentIndex === element.parentNode.childNodes.length - 1){
              doNextPage();
            }
          },
          transitionEnd: function(currentIndex, element){
            doResolveTheResolver();
            doUpdate(currentIndex, element);
          }
        });

        if(doneTables === 1){
          nextPage();
          deferredContainer.deferred.resolver.resolve();
          updateHeader(elementReference.querySelector('.st-table-wrap'));
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

  var goToPage = function(page){
    alert('Going to page ' + (page + 1));
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

  var updateMainScrollbar = function(index){
    var style = mainScrollbar.firstChild.style;

    style.width = ( 100 / pageAmount) + '%';

    var position = 100 * index;

    style.webkitTransform = 'translate(' + position + '%)';
    style.msTransform =
    style.MozTransform =
    style.OTransform = 'translateX(' + position + '%)';
  };

  var updateHeaderScrollbar = function(){
    var scrollbarStyle = headerScrollbar.style;
    var indicatorStyle = headerScrollbar.firstChild.style;
    var parent = headerScrollbar.parentElement;

    var ratio = parent.getBoundingClientRect().width / parent.scrollWidth;
    var position = updateScroll.getPosition();

    indicatorStyle.width = ratio * 100 + '%';

    scrollbarStyle.webkitTransform = 'translate(' + position + 'px)translateZ(0)';
    scrollbarStyle.msTransform =
    scrollbarStyle.MozTransform =
    scrollbarStyle.OTransform = 'translateX(' + position + 'px)';

    position = position * ratio;

    indicatorStyle.webkitTransform = 'translate(' + position + 'px)translateZ(0)';
    indicatorStyle.msTransform =
    indicatorStyle.MozTransform =
    indicatorStyle.OTransform = 'translateX(' + position + 'px)';
  };

  var update = function(index, element){
    updateHeader(element);
    updateHeaderScrollbar();
    updateMainScrollbar(index);
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
          var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);
          var doFrameRequested = updateScroll.frameRequested.bind(this);
          frameRequested = true;

          window.requestAnimationFrame(function(){
            doUpdateHeaderScrollbar();
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
