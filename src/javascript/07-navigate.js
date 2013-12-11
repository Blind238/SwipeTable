  var nextPage = function(){
    var index = swipeReference.getPos();

    deferredContainer[index + 1] = when.defer();

    if (stWrap.children.item(index + 1).getAttribute('data-timestamp') == timestamp){

      deferredContainer[index + 1].promise.then(
          function(value){
          stWrap.children.item(index + 1).setAttribute('data-active', 'true');
          update(value[0],value[1]);
          }
        );
    }
    else{

      var pagePromise = getPageFromIndex(index + 1);

      when.all([pagePromise, deferredContainer[index + 1].promise])
      .then(
        function(values){
          stWrap.children.item(index + 1).innerHTML = values[0].innerHTML;
          stWrap.children.item(index + 1).setAttribute('data-active', 'true');
          stWrap.children.item(index + 1).setAttribute('data-timestamp', timestamp);
          update(values[1][0],values[1][1]);
        }
      );
    }
  };

  var previousPage = function(){
    var index = swipeReference.getPos();

    deferredContainer[index - 1] = when.defer();

    if (stWrap.children.item(index - 1).getAttribute('data-timestamp') == timestamp){

      deferredContainer[index - 1].promise.then(
          function(value){
          stWrap.children.item(index - 1).setAttribute('data-active', 'true');
          update(value[0],value[1]);
          }
        );
    }
    else{

      var pagePromise = getPageFromIndex(index - 1);

      when.all([pagePromise, deferredContainer[index - 1].promise])
      .then(
        function(values){
          stWrap.children.item(index - 1).innerHTML = values[0].innerHTML;
          stWrap.children.item(index - 1).setAttribute('data-active', 'true');
          stWrap.children.item(index - 1).setAttribute('data-timestamp', timestamp);
          update(values[1][0],values[1][1]);
        }
      );
    }
  };

  var goToPage = function(page){

    deferredContainer[page - 1] = when.defer();

    if (stWrap.children.item(page - 1).getAttribute('data-timestamp') == timestamp){

      swipeReference.slide(page-1);
      deferredContainer[page - 1].promise.then(
          function(value){
            var oldElements = stWrap.querySelectorAll('.st-table-wrap[data-active="true"]');
            [].forEach.call(oldElements, function(value){
              value.setAttribute('data-active', 'false');
              value.setAttribute('data-timestamp', '');
              value.innerHTML = 'placeholder';
            });
            stWrap.children.item(page - 1).setAttribute('data-active', 'true');
            update(value[0],value[1]);
          }
        );
    }
    else{

      getPageFromIndex(page-1).then(
        function(value){
          var oldElements = stWrap.querySelectorAll('.st-table-wrap[data-active="true"]');
            [].forEach.call(oldElements, function(value){
              value.setAttribute('data-active', 'false');
              value.setAttribute('data-timestamp', '');
              value.innerHTML = 'placeholder';
            });
          stWrap.children.item(page-1).innerHTML = value.innerHTML;
          stWrap.children.item(page-1).setAttribute('data-active', 'true');
          stWrap.children.item(page-1).setAttribute('data-timestamp', timestamp);
          return when.resolve();
        }
      ).then(
        function(){
          swipeReference.slide(page-1);
          deferredContainer[page - 1].promise.then(
            function(value){
              update(value[0],value[1]);
            });
        }
      );
    }
  };

  var getPageFromIndex = function(index){

    var dataDeferred = when.defer();
    var table;

    if(sortColumn === undefined){
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          timestamp: timestamp
        },
        dataDeferred.resolver
      );
    }
    else{
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          sortField: sortColumn,
          sortAsc: sortAscending
        },
        dataDeferred.resolver
      );
    }

    table = createTable();

    var tablePromise = dataDeferred.promise.then(
      function(value){
        return fillTable(table, value);
      }
    );

    return tablePromise;
  };
