  var dataProvider = dataProviderUrl,
      keys         = tableKeys,
      container    = elem;

  var stWrap,
      currentIndexElement,
      swipeReference,
      deferredContainer = [];

  var pageSize,
      pageAmount,
      headerHeight    = 50,
      scrollbarHeight =  5,
      controlHeight   = 50,
      rowSizes;

  var sortAscending   = true,
      sortColumn,
      timestamp,
      newItems;

  var headerScrollbar,
      mainScrollbar;

  var controls;

  var boundEvents = {};

  options = options || {};

  if(typeof options.fullscreen !== 'boolean'){
    // Use default
    options.fullscreen = true;
  }

  if(options.fullscreen){
    container.className+= ' st-fullscreen';
  }
  else{
    container.className+= ' st-not-fullscreen';
  }

  options.demo == options.demo || false;

  var tableClass = options.tableClass || '';

  var slides, slidePos, width, length;
