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

  var testSizes = function(){
    var headerHeight,
        headerCellWidth,
        headerCellPadding,
        bodyHeight,
        bodyCellWidth,
        bodyCellPadding,
        totalHeight;

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
    table.style.width = '40px';
    table.style.tableLayout = 'fixed';

    head.appendChild(text);
    head.style.width = '80px';
    row.appendChild(head);
    tHead.appendChild(row);
    table.appendChild(tHead);

    data.appendChild(text2);
    data.style.width = '80px';
    row2.appendChild(data);
    tBody.appendChild(row2);
    table.appendChild(tBody);

    stWrap.appendChild(table);

    headerHeight = row.getBoundingClientRect().height;
    headerCellWidth = head.getBoundingClientRect().width;

    bodyHeight = row2.getBoundingClientRect().height;
    bodyCellWidth = data.getBoundingClientRect().width;

    totalHeight = table.getBoundingClientRect().height;

    head.style.padding = '0';
    data.style.padding = '0';
    headerCellPadding = headerCellWidth - head.getBoundingClientRect().width;
    bodyCellPadding = bodyCellWidth - data.getBoundingClientRect().width;

    //TODO: Determine effects of borders on table size
    //
    stWrap.innerHTML = '';

    return {
      headerHeight      : headerHeight,
      headerCellWidth   : headerCellWidth,
      headerCellPadding : headerCellPadding,
      bodyHeight        : bodyHeight,
      bodyCellWidth     : bodyCellWidth,
      bodyCellPadding   : bodyCellPadding,
      totalHeight       : totalHeight,

    };
  };
