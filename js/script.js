var jsPlugin = (function(){
    "use strict";

    // Define keys that your table will use,
    // in the order you want them to be displayed.
    // First item is leftmost, last item is rightmost
    //TODO: Fix above sentence
    var keys = [
        "id",
        "time",
        "time2",
        "location",
        "location2"
    ];

    var tableClass = 'table';
    var rowHeight = 39;
//    tableClass += ' table-bordered';
    tableClass += ' table-condensed'; rowHeight = 33;


    // RESTful provider URI
    // (relative or absolute)
    var dataProvider = "api";

    //---------------------------------------------
    //== No more configuration beyond this point ==
    //
    //=== Variables ===
    //Initialize other variables
    var doneTables = 0;
    var totalTables = 0;
    var pageSize = 1;
    var sortColumn;
    var sortAscending = true;

    //=== Functions ===

    var init = function(){
        // responsejs.com/labs/dimensions/
        var matchMedia = window.matchMedia || window.msMatchMedia;
        var viewportH = (function(win, docElem, mM) {
            var client = docElem['clientHeight']
                , inner = win['innerHeight'];
            return ( mM && client < inner && true === mM('(min-height:' + inner + 'px)')['matches']
                ? win['innerHeight']
                : docElem['clientHeight']
                );
        }(window, document.documentElement, matchMedia));

        // Remove one rowHeight for the header;
        viewportH -= rowHeight;
        viewportH -= rowHeight;
        pageSize = Math.floor(viewportH / rowHeight);
    }

    var makeRequest = function (table, server, page, sortField, sortAsc){
        console.log("Making request to "+ server+ ".");
        var r = new XMLHttpRequest();
        if (page === (null || undefined) && sortField === undefined && sortAsc === undefined){
            r.open("GET", server + "?p=1&ps=" + pageSize, true);
//            r.open("GET", server + "?p=2&ts=" + (+Date.now()), true);
            r.onreadystatechange =  function(){
                if(r.readyState !== 4 || r.status !== 200){
                    console.log("Request went sour");
                    return;
                }
                console.log("Request successful.");
                parseResponse(table, r.responseText);
            };
        }
        else if(sortField !== undefined && sortAsc !== undefined){
            r.open("GET", server + "?sort[field]=" + sortField + "&sort[asc]=" + sortAsc, true);
            r.onreadystatechange =  function(){
                if(r.readyState !== 4 || r.status !== 200){
                    console.log("Request went sour");
                    return;
                }
                console.log("Request successful.");
                parseResponse(table, r.responseText);
            };
        }
        else if(page !== (null || undefined)){
            r.open("GET", server + "?p=" + page + "&ps=" + pageSize, true);
            r.onreadystatechange =  function(){
                if(r.readyState !== 4 || r.status !== 200){
                    console.log("Request went sour");
                    return;
                }
                console.log("Request successful.");
                parseResponse(table, r.responseText);
            };
        }
        r.send(null);
    };

    var parseResponse = function(table, response){
        console.log("Parsing response.");
        fillTable(table, JSON.parse(response));
    };

    var createTable = function(){
        console.log("Creating Table.");
        var i = 0;
        var table = document.createElement("table");
        table.className = tableClass;
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        for (i; i < keys.length; i+=1){
            var th = document.createElement("th");
            th.appendChild(document.createTextNode(keys[i]));
            tr.appendChild(th);
        }

        thead.appendChild(tr);
        table.appendChild(thead);
        console.log("Table created.");
        totalTables += 1;
        return table;
    };

    var fillTable = function(table, dataSet){
        console.log("Filling table.");

        var numRows = dataSet.length;
        if(numRows === 0){
            return;
        }

        var tbody = document.createElement("tbody");
        table.appendChild(tbody);

        var i = 0;
        while (i < numRows){
            var col = dataSet[i];
            var tr = document.createElement("tr");
            var colCells = Object.keys(col).length;

            var j = 0;
            while (j < colCells)
            {
                var td = document.createElement("td");
                td.appendChild(document.createTextNode(col[keys[j]]));
                tr.appendChild(td);
                j+=1;
            }

            tbody.appendChild(tr);
            i+=1;
        }
        var container = document.getElementsByClassName('container')[0];
        var tableContainer = document.createElement('div');
        var scrollableContainer = tableContainer.cloneNode(true);
        var pinnedContainer = tableContainer.cloneNode(true);
        tableContainer.className = 'table-container table-wrapper';
        scrollableContainer.className = 'scrollable';
        pinnedContainer.className = 'pinned';
        var cloned = table.cloneNode(true);
        table.className +=' responsive';
        scrollableContainer.appendChild(table);
        pinnedContainer.appendChild(cloned);
        tableContainer.appendChild(scrollableContainer);
        tableContainer.appendChild(pinnedContainer);
        container.appendChild(tableContainer);
        tableDone();
    };

    var tableDone = function(){
        doneTables += 1;
        if (doneTables === totalTables){
            if(window.mySwipe === undefined){
                window.mySwipe = Swipe(document.getElementById('slider'),{
                    continuous:false,
                    callback: function(currentIndex, element){
                        if (currentIndex === element.parentNode.childNodes.length - 1){
                            console.log("fetching next item");
                            jsPlugin.nextPage();
                        }
                    },
                    transitionEnd: function(currentIndex, element){
                        jsPlugin.updateHeader(element);
                    }
                });
                if(doneTables === 1){
                    nextPage();
                    updateHeader(document.getElementsByClassName('table-container')[0]);
                }
            }
            else {
                window.mySwipe.setup();
            }
        }
    };

    var nextPage = function(plusOne){
        var pos = window.mySwipe.getPos() + 1;
        if(plusOne===true){
            pos+=1;
        }

        var table = createTable();
        if(sortColumn === undefined){
            makeRequest(table, dataProvider, pos + 1);
        }
        else{
            makeRequest(table, dataProvider, pos + 1, sortColumn, sortAscending);
        }
    };

    var updateHeader = function(element){
        var copy = element.cloneNode(true);
        var header = document.getElementsByClassName('table-header')[0];
        header.innerHTML = '';
        copy.removeAttribute('style');
        copy.removeAttribute('data-index');
        header.appendChild(copy);
    };

    //=== Logic ===
    init();

    var dataTable = createTable();
    console.log("dataProvider === " + dataProvider);
    makeRequest(dataTable, dataProvider);
    updateHeader(dataTable);

    var methods = {
        nextPage : nextPage,
        updateHeader : updateHeader
    };

    return methods;
}());