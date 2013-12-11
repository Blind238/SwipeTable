  var createHeader = function(){
    var i;
    var l;

    var header = document.createElement('div');
    header.className = 'st-header';

    var table = document.createElement('table');
    var tHead = document.createElement('thead');
    var row   = document.createElement('tr');

    var tableClone = table.cloneNode(true);
    var tHeadClone = tHead.cloneNode(true);
    var rowClone = row.cloneNode(true);

    var pinnedClone;

    var stScrollable = document.createElement('div');
    stScrollable.className = 'st-scrollable';
    var stScrollableWrap = stScrollable.cloneNode(true);
    stScrollableWrap.className += '-wrap';

    for (i = 0, l = keys.length; i < l; i+=1){
      var head = document.createElement('th');
      head.appendChild(document.createTextNode(keys[i]));

      if(i === 0){
        pinnedClone = head.cloneNode(true);
      }

      row.appendChild(head);
    }

    tHead.appendChild(row);
    table.appendChild(tHead);
    table.className = tableClass;

    rowClone.appendChild(pinnedClone);
    tHeadClone.appendChild(rowClone);
    tableClone.appendChild(tHeadClone);
    tableClone.className = tableClass;

    var stPinned = document.createElement('div');
    stPinned.appendChild(tableClone);
    stPinned.className = 'st-pinned';

    stScrollable.appendChild(table);
    stScrollableWrap.appendChild(stScrollable);

    header.appendChild(stScrollableWrap);
    header.appendChild(stPinned);
    container.appendChild(header);

    // Fixes table borders not updating on width changes
    translate(null, 0, 0, stScrollable);

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

    var buttonGlyphs  = ['<<', '<', 'R', '>', '>>'];
    var events = ['first', 'previous', 'refresh', 'next', 'last'];
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
      refresh: function(element){
        var clickEvent = function(){
          if (newItems > 0){
            //TODO: Proper refresh
            // Reset timestamp
            timestamp = Date.now();
            init();
          }
        };

        var doClickEvent = clickEvent.bind(this);

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
      // If it's supposed to be the refresh button,
      // add the page and reload indicators.
      if(glyph === 'R'){
        var pageText = document.createElement('span');
        var reloadText = pageText.cloneNode(true);
        pageText.className = 'st-page-number';
        reloadText.className = 'st-reload-text';
        button.appendChild(pageText);
        button.appendChild(reloadText);
        // SVG from icomoon.io, "IcoMoon - Free" font, GPL
        // Only modification was adding a couple of classes.
        button.insertAdjacentHTML('beforeend', '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          'class="st-reload-svg" width="32" height="32" viewBox="0 0 32 32">' +
            '<path class="st-reload-path" d="M27.313 4.687c-2.895-2.896-6.895-4.687-11.313-4.687-6.859 0-12.709 4.316-14.984 ' +
            '10.381l3.746 1.405c1.706-4.548 6.094-7.786 11.238-7.786 3.314 0 6.313 1.344 8.485 3.515l-4.485 4.485h12v-12l-4.687 ' +
            '4.687zM16 28c-3.314 0-6.313-1.343-8.485-3.515l4.485-4.485h-12v12l4.687-4.687c2.895 2.896 6.894 4.687 11.313 4.687 ' +
            '6.859 0 12.709-4.316 14.984-10.381l-3.746-1.405c-1.706 4.548-6.094 7.786-11.238 7.786z" fill="#000000" />' +
          '</svg>');
      }
      else{
        button.appendChild(document.createTextNode(glyph));
      }
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
