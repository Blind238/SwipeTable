  /*---------------- Init ----------------*\
   Test element heights, create UI elements,
   get the first page and prep the next one
  \*----------------      ----------------*/

  var init = function(){
    //Cleanup old events if any
    if(swipeReference){
      swipeReference.kill();
      window.removeEventListener('orientationchange', boundEvents.init);
      window.removeEventListener('resize', boundEvents.update);
    }
    // Remove everything inside the container
    container.innerHTML = '';

    var tableHeight;
    var requestDeferred = when.defer();
    var dataTable = createTable();

    stWrap = document.createElement('div');
    stWrap.className = 'st-wrap';
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

    rowSizes = testSizes();

    // Add margin for proper spacing of elements
    stWrap.style.marginTop = headerHeight - rowSizes.headerHeight + 'px';

    // Remove height for other elements
    tableHeight -= headerHeight;
    tableHeight -= scrollbarHeight;
    tableHeight -= controlHeight;

    pageSize = Math.floor(tableHeight / rowSizes.bodyHeight);

    // Make the request for the first page
    if (options.demo){
      makeRequest(
        dataProvider,
        {demo: true},
        requestDeferred.resolver);
      options.demo = false;
    }
    else{
      if(timestamp){
        makeRequest(
        dataProvider,
        {
          timestamp:timestamp,
          page:1
        },
        requestDeferred.resolver);
      }
      else {
        makeRequest(
        dataProvider,
        {},
        requestDeferred.resolver);
      }
    }

    createHeader();

    var doUpdateHeader = updateHeader.bind(this);
    var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);

    boundEvents.update = function(){
      doUpdateHeader();
      doUpdateHeaderScrollbar();
    };

    window.addEventListener('resize', boundEvents.update);

    boundEvents.init = init.bind(this);

    window.addEventListener('orientationchange', boundEvents.init);

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
        value.setAttribute('data-timestamp', timestamp);
        stWrap.appendChild(value);

        // Fill with placeholders so that first and last will
        // function as expected. This also results in less calls
        // needed to swipeReference.setup()
        for (i = 1; i < pageAmount; i+=1){
          stWrap.appendChild(stTableWraps[i-1]);
        }

        createSwipe();

        nextPage();
        resolveTheResolver(1); // So nextPage's promise passes
        updateHeader(container.querySelector('.st-table-wrap'));

        updateMainScrollbar(0);
        updateHeaderScrollbar();

        var headerStyles = container.querySelectorAll('.st-header .st-scrollable th');
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

    // Remove click delay for mobile
    attachFastClick(container);

    // Fixes iOs vertical bouncing on scroll
    if(options.fullscreen){
      bouncefix.add('swipe-table');
    }
  };
