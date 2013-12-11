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
          executeRequest('GET',
                          server +
                            '?p=' + queries.page +
                            '&ps=' + pageSize +
                            '&ts=' + queries.timestamp +
                            '&sort[field]=' + queries.sortField +
                            '&sort[asc]=' + queries.sortAsc,
                          resolver);
        }
        // Else, it's a sorted and timestamped first page equest
        else{
          executeRequest('GET',
                          server +
                            '?ps=' + pageSize +
                            '&ts=' + queries.timestamp +
                            '&sort[field]=' + queries.sortField +
                            '&sort[asc]=' + queries.sortAsc,
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
        executeRequest('GET',
                        server +
                          '?p=' + queries.page +
                          '&ps=' + pageSize +
                          '&ts=' + queries.timestamp,
                        resolver);
      }
    }
    else{
      // No timestamp given, it's a fresh page request
      if (queries.demo){
        executeRequest('GET',
                        server +
                          '?ps=' + pageSize +
                          '&demo=true',
                        resolver);
      }
      else{
        executeRequest('GET',
                        server +
                          '?ps=' + pageSize,
                        resolver);
      }
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
