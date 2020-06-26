gostApp.controller('ThingCtrl', function ($scope, $http, $routeParams, $location, $timeout, $window, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('THING(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);

    $scope.category = 'Thing'

    //toggle map displays
    $scope.noMapControls = true

    //pagination example for ng-repeat tables
    //http://jsfiddle.net/2ZzZB/56/

    //also add and remove columns by defining all of them, then display none for those not listed in the route params. does not work for those that dont need expanding
    // better: add all of them and let user enable with checkboxes and if necessary then add the route params?

    //tabs of the entity (properties, location, ...) should then follow the scheme by taking the same query and add like things(saqn:t:...)/historicallocations
    // --> thing/saqn:t:.../historicallocations ?
    // also, why distinguish things and thing here? frost server doesnt. treat as new page things/saqn:t:... 

    //remove query params
    $location.search({})

    //$scope.patchThing = {}
    $scope.patchLocation = {}

    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")?$expand=Locations").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.properties = response.data["properties"];
        $scope.Page.selectedThing = response.data;
        //$scope.location = response.data["Locations"][0]["location"]["coordinates"];
        $scope.showMap = true;

      $scope.thing = response.data;

        /*
        $scope.patchThing.name = $scope.name;
        $scope.patchThing.description = $scope.description;
        $scope.patchThing.properties = $scope.properties;
        $scope.patchThing.id = $scope.id;
        */
        $scope.patchtarget = $scope.Page.selectedThing["@iot.selfLink"]
        $scope.patchpw = ''
        $scope.pwvalid = ''

      //on page load: if the thing does not have a properties field, set it with key unknown
      if(!$scope.thing.hasOwnProperty('properties')){
        $scope.thing["properties"] = {}
      }

      //Initiate Tree: load entity to patch into format that is readable for angularjs
      $scope.item = {}
      $scope.item.items = []
      $scope.traverse($scope.thing,$scope.item.items)
      //console.log($scope.item.items)
      // check gives true that traverse and esrevart are indeed inverse to each other
      //console.log(JSON.stringify($scope.testthing)==JSON.stringify($scope.jsonobj))

      //add items to item, so that first ng-repeat has same structure to work with as the recursive repeats
      /*$scope.item = {
        items: $scope.items
      }*/


    });

    // ----------------------------------------------------------------------------------------------------------------------
    // Traversing Nested Arrays with AngularJS, adapted from https://stackoverflow.com/questions/23315679/angularjs-traversing-nested-arrays 


    
    /*unused
    $scope.addSiblingItem = function(items, position) {
      items.splice(position + 1, 0, {
        key: 'sibling - new key',
        value: 'sibling - new value',
        items: []
      });
    }

    $scope.addParentSibling = function(item) {
      var parentSibling = {
        key: 'aunt - key',
        value: 'aunt - value',
        items: []      
      };
      
      if (item.items)
      item.items.push(parentSibling);
      else //root
      item.push(parentSibling);    
    }
    */



    
    $scope.deleteMe = function(items, position) {
      items.splice(position, 1);
    }


    //function that checks the items list in the tree representation if a key at that level already exists to prevent adding it --> otherwise adding it would overwrite the old one
    $scope.propertyKeyExists = function(listofitems, prop){
      var exists = false
      listofitems.forEach(function(thisitem){
        if(thisitem.key==prop){
          exists = true
        }
      });
      return exists
    };

    //add item at relative position
    $scope.addItem = function(item,itemkey) {
      if(!$scope.propertyKeyExists(item.items, itemkey)){
        item.items.push({
          key: itemkey,
          value: undefined,
          items: []
        });
      } else {
        alert("Key does already exist!")
      }
    }

    //add an item at base level to properties
    $scope.addNewProperty = function(itemkey){
      var newitem = {}
      newitem["key"] = itemkey
      newitem["value"] = undefined
      newitem["items"] = []

      $scope.item.items.forEach(function(obj){
        if(obj["key"] === 'properties'){
          if(!$scope.propertyKeyExists(obj["items"], itemkey)){
            obj["items"].push(newitem)
          } else {
            alert("Key does already exist!")
          }
        }
      });
    };



    //view filters
    $scope.containsNoIot = function(obj){
      return (!obj.key.includes('@iot'))
    };

    $scope.excludeFixedProperties = function(obj){
      return((obj.key != "hardware.id") && (obj.key != "shortname") && (obj.key != "operator.domain"))
    }

    $scope.excludeOthers = function(obj){
      return(obj.key != "Locations")
    }

    $scope.excludeAllProperties = function(obj){
      return(obj.key != "properties")
    }

    // ----------------------------------------------------------------------------------------------



    $scope.mapVisible = true;

    $scope.tabPropertiesClicked = function () {
    };

    $scope.tabLocationsClicked = function () {
    };


    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Locations").then(function (response) {
        
      $scope.locationsList = response.data.value;

      if($scope.locationsList.length!= 0){
      $scope.patchLocation = $scope.locationsList[0]

      //display current thing location in another color --> change color of the respective pin
      //not working atm, cant find the functions which are defined in the map controller... maybe add this function to the map controller where the view is centered and check the current scope
      //highlightCurrentFeature($scope.locationsList[0]["location"]["coordinates"])         
      //} else {
        //alert("no location defined, please use 'move to new location' to define one")
      }

    });

    $scope.newLocation = {
      "name": "",
      "description": "",
      "encodingType": "application/vnd.geo+json",
      "location": {
        "type": "Point",
        "coordinates": []
      },
      "@iot.id": ""
    };

    $scope.$watch('newLocation.location.coordinates', function () {
      $scope.newLocation['@iot.id'] = "geo:" + $scope.newLocation.location.coordinates[1] + "," + $scope.newLocation.location.coordinates[0] + "," + $scope.newLocation.location.coordinates[2]
    }, true);


    $scope.tabHistoricalLocationsClicked = function () {
        $http.get(getUrl() + "/v1.0/Things(" + getId($scope.Page.selectedThing["@iot.id"]) + ")/HistoricalLocations?$expand=Locations").then(function (response) {
            $scope.historicalLocationsList = response.data.value;
        });
    };

    $scope.tabDatastreamsClicked = function () {
        $http.get(getUrl() + "/v1.0/Things(" + getId($scope.Page.selectedThing["@iot.id"]) + ")/Datastreams?$expand=ObservedProperty").then(function (response) {
            $scope.datastreamsList = response.data.value;
        });
    };

    $scope.datastreamClicked = function (datastreamID) {
        angular.forEach($scope.things, function (value, key) {
            if (value["@iot.id"] == thingID) {
                $scope.Page.selectedDatastream = value;
            }
        });

        $scope.Page.go("datastream/" + datastreamID);
    };

  $scope.sortBy = function(propertyName) {
    $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
    $scope.propertyName = propertyName;
  };


  $(function() {
    $('#calendar').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: moment().subtract(24, 'hour'),
        endDate: moment(),
        drops: "up",
                ranges: {
                    'Last Hour': [moment().subtract(1, 'hours'), moment()],
                    'Last 3 Hours': [moment().subtract(3, 'hours'), moment()],
                    'Last 6 Hours': [moment().subtract(6, 'hours'), moment()],
                    'Last 12 Hours': [moment().subtract(12, 'hours'), moment()],
                    'Last 24 Hours': [moment().subtract(24, 'hours'), moment()],
                    'Last 3 Days': [moment().subtract(3, 'days'), moment()]
                },
        locale: {
            format: 'YYYY-MM-DD HH:mm:ss'
        }
    },pushDateToQuery);
  });




  function pushDateToQuery(start, end){
    //for watch service
    $scope.timeframe.from = start
    $scope.timeframe.to = end

    //parameter for the download functonality
    $scope.timeframe.fromISO = start.toISOString()
    $scope.timeframe.toISO = end.toISOString()

    //for displaying the query
    $scope.selectedTimeframe = "(resultTime ge " + $scope.timeframe.fromISO + " and resultTime le " + $scope.timeframe.toISO + ")"
    $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"

  }

  pushDateToQuery(moment().subtract(24, 'hour'),window.moment())

  $scope.testthing = {}
  $scope.testthing["testkey"] = "testval"
  
  $scope.getObjectKey = function(obj){
      return(obj.keys())
  }



  $(function() {
    $('#calendarTimestamp').daterangepicker({
        singleDatePicker: true,
        timePicker: true,
        timePicker24Hour: true,
        startDate: moment(),
        drops: "up",
        locale: {
            format: 'YYYY-MM-DD HH:mm:ss'
        }
    },pushTimestamp);
  });
  
  
  
  
  function pushTimestamp(start){
    //for watch service
    $scope.newHistoricalLocation = start.toISOString()
  }

  pushTimestamp(moment())



  $scope.displayLocationTrace = false;
  $scope.displayFoI = false;

  var datalon
  var datalat
  var dataalt

  $scope.loadLocationTrace = function(){

    // get information and construct the graph
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/HistoricalLocations?$expand=Locations").then(function(response){

      var res = response.data.value;


      var resLabels = res.map(el => el["time"]);

      datalon={
        label: "Longitude", 
        steppedLine: "after", 
        data: res.map(el => el.Locations[0]["location"]["coordinates"][0]),
        borderColor: "rgba(156,115,135,1)",
        fill: false, 
      }

      datalat={
        label: "Latitude", 
        steppedLine: "after", 
        data: res.map(el => el.Locations[0]["location"]["coordinates"][1]),
        borderColor: "rgba(115,135,156,1)",
        fill: false, 
      }

      dataalt = {
        label: "Altitude", 
        steppedLine: "after", 
        data: res.map(function(el){
          if(el.Locations[0]["location"]["coordinates"][2]){
            return el.Locations[0]["location"]["coordinates"][2]
          } else {
            return undefined
          }
        }), 
        borderColor: "rgba(135,156,115,1)",
        fill: false, 
      }

      var ctx = document.getElementById('LocationGraph').getContext('2d');
      locationChart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: resLabels,
              datasets:[datalat,datalon,dataalt]
          }, 
          options: {
            tooltips: {
              mode: 'index',
              intersect: false
              },
              hover: {
                  mode: 'index',
                  intersect: false
              },
              responsive: true,
              aspectRatio: 2,
              title: {
                  display: true,
                  text: "Historical Locations",
              },
              scales: {
                  xAxes: [{
                      type: 'time',
                      time: {
                        tooltipFormat: 'YYYY-MM-DD hh:mm:ss', 
                        displayFormats: {
                          'millisecond': 'YYYY-MM-DD hh:mm:ss',
                          'second': 'YYYY-MM-DD hh:mm:ss',
                          'minute': 'YYYY-MM-DD hh:mm:ss',
                          'hour': 'YYYY-MM-DD hh:mm:ss',
                          'day': 'YYYY-MM-DD hh:mm:ss',
                          'week': 'YYYY-MM-DD hh:mm:ss',
                          'month': 'YYYY-MM-DD hh:mm:ss',
                          'quarter': 'YYYY-MM-DD hh:mm:ss',
                          'year': 'YYYY-MM-DD hh:mm:ss'
                      }
                      }
                  }],
                  yAxes: [{
                    display: true,
                    scaleLabel: {
                      display: true,
                      labelString: 'Coordinate'
                    }
                  }]
              }
          }
      });
    });
  };

  $scope.loadLocationTrace()

  $scope.addData = function(name) {
    // locationChart.data.labels.push(label);
    [datalon,datalat,dataalt].forEach(function(el){
      if(el.label == name){
        locationChart.data.datasets.push(el)
      }
    });
    locationChart.update();
  };

  $scope.removeData = function(name) {
    // locationChart.data.labels.pop();
    let filteredarray = locationChart.data.datasets.filter(function(el){return el.label!=name})
    locationChart.data.datasets=filteredarray
    // locationChart.data.datasets.forEach((dataset) => {
    //   dataset.pop();
    // });
    locationChart.update();
  }

  $scope.toggleData = function(name){
    if(locationChart.data.datasets.map(el => el.label).includes(name)){
      $scope.removeData(name)
    } else {
      $scope.addData(name)
    }
  }



  $scope.FoItop=50
  $scope.FoIskip=0

  var foilon
  var foilat
  var foialt


  $scope.loadFoITrace = function(dsid){

    // get information and construct the graph
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Datastreams('" + dsid + "')/Observations?$expand=FeatureOfInterest($select=feature)&$select=resultTime,FeatureOfInterest&$top=" + $scope.FoItop + "&$skip=" + $scope.FoIskip).then(function(response){

      var res = response.data.value.map(function(el){
        return {"resultTime": el["resultTime"], "coordinates": el["FeatureOfInterest"]["feature"]["coordinates"]}
      })


      var resLabels = res.map(el => el["resultTime"]);

      foilon={
        label: "Longitude", 
        steppedLine: "after", 
        data: res.map(el => el["coordinates"][0]),
        borderColor: "rgba(156,115,135,1)",
        fill: false, 
      }

      foilat={
        label: "Latitude", 
        steppedLine: "after", 
        data: res.map(el => el["coordinates"][1]),
        borderColor: "rgba(115,135,156,1)",
        fill: false, 
      }

      foialt = {
        label: "Altitude", 
        steppedLine: "after", 
        data: res.map(function(el){
          if(el["coordinates"][2]){
            return el["coordinates"][2]
          } else {
            return undefined
          }
        }), 
        borderColor: "rgba(135,156,115,1)",
        fill: false, 
      }

      var ctx = document.getElementById('LocationGraph').getContext('2d');
      locationChart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: resLabels,
              datasets:[foilat,foilon,foialt]
          }, 
          options: {
            tooltips: {
              mode: 'index',
              intersect: false
              },
              hover: {
                  mode: 'index',
                  intersect: false
              },
              responsive: true,
              aspectRatio: 2,
              title: {
                  display: true,
                  text: "Feature of Interest",
              },
              scales: {
                  xAxes: [{
                      type: 'time',
                      time: {
                        tooltipFormat: 'YYYY-MM-DD hh:mm:ss', 
                        displayFormats: {
                          'millisecond': 'YYYY-MM-DD hh:mm:ss',
                          'second': 'YYYY-MM-DD hh:mm:ss',
                          'minute': 'YYYY-MM-DD hh:mm:ss',
                          'hour': 'YYYY-MM-DD hh:mm:ss',
                          'day': 'YYYY-MM-DD hh:mm:ss',
                          'week': 'YYYY-MM-DD hh:mm:ss',
                          'month': 'YYYY-MM-DD hh:mm:ss',
                          'quarter': 'YYYY-MM-DD hh:mm:ss',
                          'year': 'YYYY-MM-DD hh:mm:ss'
                      }
                      }
                  }],
                  yAxes: [{
                    display: true,
                    scaleLabel: {
                      display: true,
                      labelString: 'Coordinate'
                    }
                  }]
              }
          }
      });
    });
  };

});