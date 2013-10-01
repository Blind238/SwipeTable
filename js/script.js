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
//    tableClass += ' table-bordered';
    tableClass += ' table-condensed';


    // RESTful provider URI
    // (relative or absolute)
    var dataProvider = "api";

    //---------------------------------------------
    //== No more configuration beyond this point ==
    //
    //=== Variables ===
    //Initialize other variables
    var dataSet;
    var doneTables = 0;
    var totalTables = 0;

    //=== Functions ===
    var makeRequest = function (table, server, page, sortField, sortAsc){
        console.log("Making request to "+ server+ ".");
        var r = new XMLHttpRequest();
        if (page === (null || undefined) && sortField === undefined && sortAsc === undefined){
            r.open("GET", server, true);
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
        r.send(null);
    };

    var parseResponse = function(table, response){
        console.log("Parsing response.");
        dataSet = JSON.parse(response);
        fillTable(table);
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

    var fillTable = function(table){
        console.log("Filling table.");
        var tbody = document.createElement("tbody");
        table.appendChild(tbody);

        var numRows = dataSet.length;

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
        tableContainer.className = 'table-container';
        tableContainer.appendChild(table);
        container.appendChild(tableContainer);
        tableDone();
    };

    var tableDone = function(){
        doneTables += 1;
        if (doneTables === totalTables){
            window.mySwipe = Swipe(document.getElementById('slider'),{
                continuous:false
            });
        }
    };

    //=== Logic ===

    var dataTable = createTable();
    console.log("dataProvider === " + dataProvider);
    makeRequest(dataTable, dataProvider);

    var secondTable = createTable();
    makeRequest(secondTable, dataProvider, null, "location2", true );

}());