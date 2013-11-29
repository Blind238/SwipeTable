var when = require('when');
var attachFastClick = require('fastclick');

module.exports = function(dataProviderUrl, tableKeys, elem, options){
  "use strict";

  var dataProvider = dataProviderUrl,
      keys         = tableKeys,
      container    = elem;

  var stWrap,
      currentIndexElement,
      swipeReference,
      deferredContainer = {};

  var pageSize,
      pageAmount,
      headerHeight    = 50,
      scrollbarHeight = 5,
      controlHeight   = 50,
      sortAscending   = true,
      sortColumn,
      timestamp;

  var headerScrollbar,
      mainScrollbar;

  var controls;

  options = options || {};

  if(typeof options.fullscreen !== 'boolean'){
    // Use default
    options.fullscreen = true;
  }

  var tableClass = options.tableClass || 'table table-condensed';

  var slides, slidePos, width, length;

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

  function Swipe(options) {


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
      })(document.createElement('swipetable'))
    };

    var headerScroll = container.querySelector('.st-header .st-scrollable');

    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;

    function setup() {

      // cache slides
      slides = stWrap.children;
      length = slides.length;


      // create an array to store current positions of each slide
      slidePos = new Array(slides.length);

      // determine width of each slide
      width = container.getBoundingClientRect().width || container.offsetWidth;

      stWrap.style.width = (slides.length * width) + 'px';

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
        stWrap.style.left = (index * -width) + 'px';
      }

      updateMainScrollbar(index, 0, 0);

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
        updateMainScrollbar(to, 0, speed);

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

    function animate(from, to, speed) {

      // if not an animation, just reposition
      if (!speed) {

        stWrap.style.left = to + 'px';
        return;

      }

      var start = Date.now();

      var timer = setInterval(function() {

        var timeElap = Date.now() - start;

        if (timeElap > speed) {

          stWrap.style.left = to + 'px';

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          clearInterval(timer);
          return;

        }

        stWrap.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

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
        stWrap.addEventListener('touchmove', this, false);
        stWrap.addEventListener('touchend', this, false);

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
            updateMainScrollbar(index, delta.x + slidePos[index], 0);

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
              updateMainScrollbar(index, -width, speed);
              move(circle(index+1), slidePos[circle(index+1)]-width, speed);
              index = circle(index+1);

            } else {
                move(index+1, width, 0);

              move(index, slidePos[index]+width, speed);
              updateMainScrollbar(index, width, speed);
              move(circle(index-1), slidePos[circle(index-1)]+width, speed);
              index = circle(index-1);

            }

            options.callback && options.callback(index, slides[index]);

          } else {

              move(index-1, -width, speed);
              move(index, 0, speed);
              updateMainScrollbar(index, 0, speed);
              move(index+1, width, speed);

          }

        }

        // kill touchmove and touchend event listeners until touchstart called again
        stWrap.removeEventListener('touchmove', events, false);
        stWrap.removeEventListener('touchend', events, false);

      },
      transitionEnd: function(event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        }

      }

    };

    var scrollStart = {};
    var scrollDelta = {};
    var scrollOffset;
    var scrollIsScrolling;

    // setup scroll event capturing
    var scrollEvents = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
        }

        if (options.stopPropagation){
          event.stopPropagation();
        }

      },
      start: function(event) {

        event.preventDefault();

        var touches = event.touches[0];

        // measure start values
        scrollStart = {

          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,

          // store time to determine touch duration
          time: Date.now()

        };

        // used for testing first move event
        scrollIsScrolling = undefined;

        // reset delta and end measurements
        scrollDelta = {};

        scrollOffset = updateScroll.getPosition();

        // attach touchmove and touchend listeners
        headerScroll.addEventListener('touchmove', this, false);
        headerScroll.addEventListener('touchend', this, false);

      },
      move: function(event) {

        var scrollTotal;

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 1 || event.scale && event.scale !== 1){
          return;
        }

        // prevent native scrolling
        event.preventDefault();

        var touches = event.touches[0];

        // measure change in x and y
        scrollDelta = {
          x: touches.pageX - scrollStart.x,
          y: touches.pageY - scrollStart.y
        };

        // determine if scrolling test has run - one time test
        if ( typeof scrollIsScrolling == 'undefined') {
          scrollIsScrolling = !!( scrollIsScrolling || Math.abs(scrollDelta.x) < Math.abs(scrollDelta.y) );
        }

        // if user is not trying to scroll vertically
        if (!scrollIsScrolling) {

          // increase resistance if first or last slide

            scrollTotal = -scrollDelta.x + scrollOffset;

            if (scrollTotal < 0){
              scrollTotal = 0;
            }
            else if (scrollTotal > headerScroll.scrollWidth - headerScroll.getBoundingClientRect().width){
              scrollTotal = headerScroll.scrollWidth - headerScroll.getBoundingClientRect().width;
            }

            updateScroll.setPosition(scrollTotal);
            translate(null, -scrollTotal, 0, headerScroll);
            updateScroll.update();

        }

      },
      end: function() {

        event.preventDefault();

        // kill touchmove and touchend event listeners until touchstart called again
        headerScroll.removeEventListener('touchmove', scrollEvents, false);
        headerScroll.removeEventListener('touchend', scrollEvents, false);

      }

    };

    // trigger setup
    setup();


    // add event listeners
    if (browser.addEventListener) {

      // set touchstart event on element
      if (browser.touch){
        stWrap.addEventListener('touchstart', events, false);
        headerScroll.addEventListener('touchstart', scrollEvents, false);
      }

      if (browser.transitions) {
        stWrap.addEventListener('webkitTransitionEnd', events, false);
        stWrap.addEventListener('msTransitionEnd', events, false);
        stWrap.addEventListener('oTransitionEnd', events, false);
        stWrap.addEventListener('otransitionend', events, false);
        stWrap.addEventListener('transitionend', events, false);
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

        stWrap.style.width = (function(){
          var w = parseInt(stWrap.style.width, 10) / length;
          w *= (length + 1);
          return (w + 'px');
        }());
      }

    };

  }

  var init = function(){
    var tableHeight;
    var rowHeights;
    var requestDeferred = when.defer();
    var dataTable = createTable();

    stWrap = document.createElement("div");
    stWrap.className = "st-wrap";
    container.appendChild(stWrap);

    if(options.fullscreen){
      document.body.parentElement.style.height = '100%';
      document.body.style.height = '100%';
      container.style.height = '100%';
      tableHeight = viewportHeight();
    }
    else{
      tableHeight = parseInt(container.getBoundingClientRect().height, 10);
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
      requestDeferred.resolver);


    createHeader();

    var doUpdateHeader = updateHeader.bind(this);
    var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);

    window.addEventListener('resize', function(){
      doUpdateHeader();
      doUpdateHeaderScrollbar();
    });

    mainScrollbar   = createScrollbar();
    headerScrollbar = createScrollbar();

    container.appendChild(mainScrollbar);
    container.querySelector('.st-header .st-scrollable').appendChild(headerScrollbar);

    controls = createControls();

    requestDeferred.promise.then(
      function(value){
        return fillTable(dataTable, value);
      }

    ).then(
      function(value){
        var stTableWraps = [];
        var i;

        var stTableWrap = document.createElement('div');
        stTableWrap.className = 'st-table-wrap';
        stTableWrap.setAttribute('data-active', 'false');

        stTableWrap.appendChild(document.createTextNode('placeholder'));

        for (i = 1; i < pageAmount; i+=1){
          stTableWraps.push(stTableWrap.cloneNode(true));
        }

        value.setAttribute('data-active', 'true');
        stWrap.appendChild(value);

        // Fill with placeholders so that first and last will
        // function as expected. This also results in less calls
        // needed to swipeReference.setup()
        for (i = 1; i < pageAmount; i+=1){
          stWrap.appendChild(stTableWraps[i-1]);
        }

        createSwipe();

        nextPage();
        resolveTheResolver(); // So nextPage's promise passes
        updateHeader(container.querySelector('.st-table-wrap'));

        updateMainScrollbar(0);
        updateHeaderScrollbar();

        var headerStyles = container.querySelectorAll('.st-header .st-scrollable > div');
        console.log(headerStyles);
        for (var l = 0; l < headerStyles.length; l+=1 ) {
          var style = headerStyles.item(l).style;

          style.webkitTransition =
          style.MozTransition =
          style.msTransition =
          style.OTransition =
          style.transition = 'width 300ms';
        }
      }
    );

    attachFastClick(container);

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

    var stScrollable = document.createElement("div");
    stScrollable.className = 'st-scrollable';
    var stScrollableWrap = stScrollable.cloneNode(true);
    stScrollableWrap.className += '-wrap';

    for (i = 1, l = keys.length; i < l; i+=1){
      var headerDiv = document.createElement("div");
      headerDiv.appendChild(document.createTextNode(keys[i]));
      stScrollable.appendChild(headerDiv);
    }

    var headerPinned = document.createElement("div");
    headerPinned.appendChild(document.createTextNode(keys[0]));
    headerPinned.className = 'st-pinned';

    stScrollableWrap.appendChild(stScrollable);

    header.appendChild(stScrollableWrap);
    header.appendChild(headerPinned);
    container.appendChild(header);

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

    var stControls = document.createElement('div');
    stControls.className = 'st-controls';

    var eventHandlers = {
      first: function(element){
        var clickEvent = function(){
          goToPage(1);
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
      stControls.appendChild(buttons[index]);
    };

    var attachEvent = function(index){
      eventHandlers[ events[index] ]( buttons[index] );
    };

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      createButton(buttonGlyphs[i]);
      attachButton(i);
    }

    container.appendChild(stControls);

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      attachEvent(i);
    }

  };

  /**
   * Figures out the request based on parameters given in the queries object.
   *
   * The queries object can contain:
   *    * page
   *    * timestamp
   *    * sortField
   *    * sortAsc
   *
   * @param  {String} server   [description]
   * @param  {Object} queries  Request parameter queries
   * @param  {Function} resolver Deferred resolver
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
   * Returns a partial table.
   */
  var createTable = (function(){
    var tableInstance;

    return function(){

      if(tableInstance){
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
        return table;
      }
    };
  }());

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
    var stTableWrap = document.createElement('div');
    // Cloning an element is faster than creating more
    var stScrollable = stTableWrap.cloneNode(true);
    var stScrollableWrap = stTableWrap.cloneNode(true);
    var stPinned = stTableWrap.cloneNode(true);

    // Add classes to the containers
    stTableWrap.className = 'st-table-wrap';
    stScrollable.className = 'st-scrollable';
    stScrollableWrap.className = 'st-scrollable-wrap';
    stPinned.className = 'st-pinned';

    // Clone data and attach both to st-pinned and st-scrollable
    var cloned = table.cloneNode(true);
    stScrollable.appendChild(table);
    stScrollableWrap.appendChild(stScrollable);
    stPinned.appendChild(cloned);

    // Attach to parent
    stTableWrap.appendChild(stScrollableWrap);
    stTableWrap.appendChild(stPinned);

    return when.resolve(stTableWrap);
  };

  var createSwipe = function(){

    var doNextPage = nextPage.bind(this);
    var doPreviousPage = previousPage.bind(this);
    var doResolveTheResolver = resolveTheResolver.bind(this);

    swipeReference = new Swipe({
      callback: function(currentIndex, element){
        var nextElement = element.nextElementSibling;
        var previousElement = element.previousElementSibling;
        var nextOldElement;
        var prevOldElement;

        if(nextElement){

          if (nextElement.getAttribute('data-active') === 'false'){
            doNextPage();
          }

          nextOldElement = nextElement.nextElementSibling;

          if(nextOldElement){
            nextOldElement.setAttribute('data-active', 'false');
          }
        }

        if(previousElement){

          if (previousElement.getAttribute('data-active') === 'false'){
            doPreviousPage();
          }

          prevOldElement = previousElement.previousElementSibling;

          if(prevOldElement){
            prevOldElement.setAttribute('data-active', 'false');
          }
        }

      },
      transitionEnd: function(currentIndex, element){
        doResolveTheResolver([currentIndex, element]);
      }
    });
  };

  var resolveTheResolver = function(value){
    deferredContainer.deferred.resolver.resolve(value);
  };

  var nextPage = function(){
    var index = swipeReference.getPos();

    deferredContainer.deferred = when.defer();

    var pagePromise = getPageFromIndex(index + 1);

    when.all([pagePromise, deferredContainer.deferred.promise])
    .then(
      function(values){
        stWrap.children.item(index + 1).innerHTML = values[0].innerHTML;
        stWrap.children.item(index + 1).setAttribute('data-active', 'true');
        update(values[1][0],values[1][1]);
      }
    );

  };

  var previousPage = function(){
    var index = swipeReference.getPos();

    deferredContainer.deferred = when.defer();

    var pagePromise = getPageFromIndex(index - 1);

    when.all([pagePromise, deferredContainer.deferred.promise])
    .then(
      function(values){
        stWrap.children.item(index - 1).innerHTML = values[0].innerHTML;
        stWrap.children.item(index - 1).setAttribute('data-active', 'true');
        update(values[1][0],values[1][1]);
      }
    );

  };

  var goToPage = function(page){

    getPageFromIndex(page-1).then(
      function(value){
        stWrap.children.item(page-1).innerHTML = value.innerHTML;
        stWrap.children.item(page-1).setAttribute('data-active', 'true');
        return when.resolve();
      }
    ).then(
      function(){
        swipeReference.slide(page-1);
        deferredContainer.deferred.promise.then(
          function(value){
            update(value[0],value[1]);
          });
      }
    );

  };

  var getPageFromIndex = function(index){

    var dataDeferred = when.defer();
    var table;

    if(sortColumn === undefined){
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          timestamp: timestamp
        },
        dataDeferred.resolver
      );
    }
    else{
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          sortField: sortColumn,
          sortAsc: sortAscending
        },
        dataDeferred.resolver
      );
    }

    table = createTable();

    var tablePromise = dataDeferred.promise.then(
      function(value){
        return fillTable(table, value);
      }
    );

    return tablePromise;
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

    var scrollContainer = container.querySelector('.st-header .st-scrollable');

    cellWidths.forEach(function(value, index){
      scrollContainer.children[index].style.width = value + 'px';
    });

  };

  var updateMainScrollbar = function(index, dist, speed){
    var style = mainScrollbar.firstChild.style;
    var indicator = mainScrollbar.firstChild;

    if (dist !== undefined){

      dist /= pageAmount;
      dist *= -1;
      dist += (index * width)/pageAmount;

      translate(null, dist, speed, indicator);
    }

    style.width = ( 100 / pageAmount) + '%';

  };

  var updateHeaderScrollbar = function(){
    var scrollbar = headerScrollbar;
    var indicator = headerScrollbar.firstChild;
    var parent = headerScrollbar.parentElement;

    var ratio = parent.getBoundingClientRect().width / parent.scrollWidth;
    var position = updateScroll.getPosition();

    indicator.style.width = ratio * 100 + '%';

    translate(null, position, 0, scrollbar);

    position = position * ratio;

    translate(null, position, 0, indicator);
  };

  var update = function(index, element){
    updateHeader(element);
    updateHeaderScrollbar();
    updateScroll.updateScrollables();
  };

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
        var targets = container.querySelector('.st-wrap').querySelectorAll('.st-table-wrap[data-active=true] .st-scrollable');

        var i = 0;
        for(i;i<targets.length;i+=1){
          translate(null, -position, 0, targets[i]);
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

  init();

};
