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
    var twoTouches;
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

        twoTouches = undefined;

        // reset delta and end measurements
        delta = {};

        // attach touchmove and touchend listeners
        stWrap.addEventListener('touchmove', this, false);
        stWrap.addEventListener('touchend', this, false);

      },
      move: function(event) {

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 2){
          return;
        }

        if (options.disableScroll){
          event.preventDefault();
        }

        var touches = event.touches[0];

        if (event.touches.length === 2){
          twoTouches = true;
        }

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
        else{
          // Tests so far show that users expect the table
          // to move vertically so that's one of the first actions they take.
          // To encourage them to move the element in a horizontal direction,
          // we'll give horizontal feedback to the vertical movement.
          event.preventDefault();

          // Always increase resistance
          delta.y = delta.y / ( Math.abs(delta.y) / width*2 + 1 );

          // translate 1:1
          translate(index-1, delta.y + slidePos[index-1], 0);
          translate(index, delta.y + slidePos[index], 0);
          translate(index+1, delta.y + slidePos[index+1], 0);
          updateMainScrollbar(index, delta.y + slidePos[index], 0);
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

              if(twoTouches){
                goToPage(pageAmount);
              }
              else{
                move(index-1, -width, 0);

                move(index, slidePos[index]-width, speed);
                updateMainScrollbar(index, -width, speed);
                move(circle(index+1), slidePos[circle(index+1)]-width, speed);
                index = circle(index+1);
              }

            } else {

              if(twoTouches){
                goToPage(1);
              }
              else{
                move(index+1, width, 0);

                move(index, slidePos[index]+width, speed);
                updateMainScrollbar(index, width, speed);
                move(circle(index-1), slidePos[circle(index-1)]+width, speed);
                index = circle(index-1);
              }
            }

            options.callback && options.callback(index, slides[index]);

          } else {

              move(index-1, -width, speed);
              move(index, 0, speed);
              updateMainScrollbar(index, 0, speed);
              move(index+1, width, speed);

          }

        }
        else{
          // If vertical swiping, always bounce back.
          // We don't want vertical swiping to be the
          // default behavior for navigation.
          move(index-1, -width, speed);
          move(index, 0, speed);
          updateMainScrollbar(index, 0, speed);
          move(index+1, width, speed);
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
          case 'mousedown': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'mousemove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
          case 'mouseup': offloadFn(this.end(event)); break;
        }

        if (options.stopPropagation){
          event.stopPropagation();
        }

      },
      start: function(event) {
        var touches;

        event.preventDefault();

        if(browser.touch){
          touches = event.touches[0];
        }
        else {
          if(event.button !== 0){
            return;
          }
          touches = event;
        }

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

        if(browser.touch){
          // attach touchmove and touchend listeners
          headerScroll.addEventListener('touchmove', this, false);
          headerScroll.addEventListener('touchend', this, false);
        }
        else{
          headerScroll.addEventListener('mousemove', this, false);
          headerScroll.addEventListener('mouseup', this, false);
        }


      },
      move: function(event) {
        var touches;
        var scrollTotal;

        if(browser.touch){
          // ensure swiping with one touch and not pinching
          if ( event.touches.length > 1 || event.scale && event.scale !== 1){
            return;
          }
        }

        // prevent native scrolling
        event.preventDefault();

        if(browser.touch){
          touches = event.touches[0];
        }
        else {
          touches = event;
        }

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

        if(browser.touch){
          // kill touchmove and touchend event listeners until touchstart called again
          headerScroll.removeEventListener('touchmove', scrollEvents, false);
          headerScroll.removeEventListener('touchend', scrollEvents, false);
        }
        else{
          headerScroll.removeEventListener('mousemove', scrollEvents, false);
          headerScroll.removeEventListener('mouseup', scrollEvents, false);
        }

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
      else{
        headerScroll.addEventListener('mousedown', scrollEvents, false);
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
      },
      kill: function() {

        // reset element
        stWrap.style.width = 'auto';
        stWrap.style.left = 0;

        // reset slides
        var pos = slides.length;
        while(pos--) {

          var slide = slides[pos];
          slide.style.width = '100%';
          slide.style.left = 0;

          if (browser.transitions) {
            translate(pos, 0, 0);
          }

        }

        // removed event listeners
        if (browser.addEventListener) {

          // remove current event listeners
          stWrap.removeEventListener('touchstart', events, false);
          headerScroll.removeEventListener('touchstart', scrollEvents, false);
          stWrap.removeEventListener('webkitTransitionEnd', events, false);
          stWrap.removeEventListener('msTransitionEnd', events, false);
          stWrap.removeEventListener('oTransitionEnd', events, false);
          stWrap.removeEventListener('otransitionend', events, false);
          stWrap.removeEventListener('transitionend', events, false);
          window.removeEventListener('resize', events, false);

        }
        else {

          window.onresize = null;

        }

      }

    };
  }

  var createSwipe = function(){

    var doNextPage = nextPage.bind(this);
    var doPreviousPage = previousPage.bind(this);
    var doResolveTheResolver = resolveTheResolver.bind(this);
    var doPushDeferred = pushDeferred.bind(this);
    var doUpdateHeader = updateHeader.bind(this);
    var doUpdate = update.bind(this);

    swipeReference = new Swipe({
      callback: function(currentIndex, element){
        var nextElement = element.nextElementSibling;
        var previousElement = element.previousElementSibling;
        var nextOldElement;
        var prevOldElement;

        if(nextElement){

          doNextPage();

          nextOldElement = nextElement.nextElementSibling;

          if(nextOldElement){
            nextOldElement.setAttribute('data-active', 'false');
            nextOldElement.setAttribute('data-timestamp', '');
            nextOldElement.innerHTML = 'placeholder';
          }
        }

        if(previousElement){

          doPreviousPage();

          prevOldElement = previousElement.previousElementSibling;

          if(prevOldElement){
            prevOldElement.setAttribute('data-active', 'false');
            prevOldElement.setAttribute('data-timestamp', '');
            prevOldElement.innerHTML = 'placeholder';
          }
        }

        if(!nextElement || !previousElement){
          doPushDeferred(currentIndex).then(
            function(value){
              doUpdate(value[0],value[1]);
            }
          );
        }

        doUpdateHeader(element);
      },
      transitionEnd: function(currentIndex, element){
        doResolveTheResolver(currentIndex, element);
      }
    });
  };

  var resolveTheResolver = function(theIndex, theValue){
    deferredContainer.forEach(function(value, index){
      deferredContainer[index].resolver.resolve([theIndex, theValue]);
    });
  };

  var pushDeferred = function(index){
    deferredContainer[index] = when.defer();
    return deferredContainer[index].promise;
  };
