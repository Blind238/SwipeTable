  var update = function(index, element){
    // Update notification
    if(newItems > 0){
      container.setAttribute('data-new', '' + newItems);
      container.querySelector('.st-reload-text').innerHTML = '' + newItems;
    }
    else{
      container.setAttribute('data-new', '0');
      container.querySelector('.st-reload-text').innerHTML = '0';
    }

    // Update page indicator
    container.querySelector('.st-page-number').innerHTML = (swipeReference.getPos() + 1) + '/' + pageAmount;

    updateHeader(element);
    updateHeaderScrollbar();
    updateScroll.updateScrollables();
  };

  /**
   * Read widths of given element and adjust header spacing
   * @param  {Object} element Element to read from
   */
  var updateHeader = function(element){
    var i, l;

    if (element){
      // Store element so we can reference on window.resize
      currentIndexElement = element;
    }

    // Select the first row of the element
    var tableRow = currentIndexElement.querySelector('.st-scrollable tr');
    l = tableRow.children.length;
    var cellWidths = [];

    for (i=0; i < l; i+=1){
      var w = tableRow.children[i].getBoundingClientRect().width;
      w = parseInt(w, 10);
      w -= rowSizes.bodyCellPadding;
      cellWidths.push(w);
    }

    var scrollContainer = container.querySelector('.st-header .st-scrollable tr');

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

    var stScrollableWrap = container.querySelector('.st-header .st-scrollable-wrap');

    if (ratio > 0.99){
      scrollbar.style.visibility =
      indicator.style.visibility = 'hidden';
      stScrollableWrap.className = 'st-scrollable-wrap';
    }
    else{
      scrollbar.style.visibility =
      indicator.style.visibility = 'visible';
      stScrollableWrap.className = 'st-scrollable-wrap st-shadow';
    }

    indicator.style.width = ratio * 100 + '%';

    translate(null, position, 0, scrollbar);

    position = position * ratio;

    translate(null, position, 0, indicator);
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
