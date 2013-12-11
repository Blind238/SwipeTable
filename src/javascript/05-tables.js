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
        var i, l;

        var table = document.createElement('table');
        table.className = tableClass;
        var thead = document.createElement('thead');
        var tr = document.createElement('tr');

        for (i = 0, l = keys.length; i < l; i+=1){
          var th = document.createElement('th');
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
    var i, j;
    newItems = dataSet.newItems;
    timestamp = dataSet.timestamp;
    pageAmount = dataSet.pages;
    var numRows = dataSet.data.length;

    if(numRows === 0){
      return;
    }

    var tbody = document.createElement('tbody');
    table.appendChild(tbody);

    i = 0;
    while (i < numRows){
      var col = dataSet.data[i];
      var tr = document.createElement('tr');
      var colCells = Object.keys(col).length;

      j = 0;
      while (j < colCells){
        var td = document.createElement('td');
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
