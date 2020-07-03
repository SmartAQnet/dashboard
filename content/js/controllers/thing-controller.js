gostApp.controller('ThingCtrl', function ($scope, $http, $routeParams, $location, $timeout, $window, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('THING(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);

    $scope.category = 'Thing'

    //toggle map displays
    $scope.noMapControls = true

    //pagination example for ng-repeat tables
    //http://jsfiddle.net/2ZzZB/56/

    //remove query params
    $location.search({})


    //Load Data
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")?$expand=Locations").then(function (response) {
  
      $scope.name = response.data["name"];
      $scope.description = response.data["description"];
      $scope.properties = response.data["properties"];
      $scope.Page.selectedThing = response.data;
      $scope.showMap = true;

      $scope.locationsList = response.data["Locations"];

      if($scope.locationsList.length!= 0){
      //display current thing location in another color --> change color of the respective pin
      //not working atm, cant find the functions which are defined in the map controller... maybe add this function to the map controller where the view is centered and check the current scope
      //highlightCurrentFeature($scope.locationsList[0]["location"]["coordinates"])         
      //} else {
        //alert("no location defined, please use 'move to new location' to define one")
      }
    });


    //Load Thing Data for Patch Tree without any expands!
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")").then(function (response) {

      //for patching Tree
      $scope.thing = response.data;

      $scope.patchtarget = $scope.Page.selectedThing["@iot.selfLink"]
      $scope.patchpw = ''
      $scope.pwvalid = ''

      //on page load: if the thing does not have a properties field, set it with key unknown
      if(!$scope.thing.hasOwnProperty('properties')){
        $scope.thing["properties"] = {}
      };

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

    /*
    $scope.excludeOthers = function(obj){
      return((obj.key != "Locations") && (obj.key != "Datastreams"))
    }
    */

    $scope.excludeAllProperties = function(obj){
      return(obj.key != "properties")
    }

    // ----------------------------------------------------------------------------------------------



    $scope.mapVisible = true;

    $scope.tabPropertiesClicked = function () {
    };

    $scope.tabLocationsClicked = function () {
    };

    //load Location Data for Patching (separate, direct request without expands or anything for safety reasons when patching stuff)
    $scope.patchLocation = {}

    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Locations").then(function (response) {
      if(response.data.value.length!=0){
        $scope.patchLocation = response.data.value[0]
      } //else here to maybe grey out patch button, force create new, whatever... 
    })

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



  $scope.locationtracedisplay = {"Latitude": true, "Longitude": true, "Altitude": true, "HistoricalLocations": true}
  var locationData = {"HistoricalLocations": {"Longitude": {}, "Latitude": {}, "Altitude": {}}}
  $scope.requestIsLoading={}

  //basic intiation stuff
  $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Datastreams").then(function(response){

    $scope.datastreamsList = response.data.value;
    $scope.datastreamsList.forEach(function(ds){
      
      var dsid = ds["@iot.id"]

      locationData[dsid]={}

      $scope.requestIsLoading[dsid] = false

      $scope.locationtracedisplay[dsid] = false
      
      let names = ["Longitude","Latitude","Altitude"]

      //initiate empty FoI Datasets
      names.forEach(function(name){
        locationData[dsid][name]={
          label: dsid + " " + name, 
          coordinateType: name,
          sourceType: dsid,
          show: false,
          steppedLine: "after", 
          data: [],
          borderColor: "rgba(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ",1)",
          fill: false, 
        }
      })
    });
  });



  $scope.loadLocationTrace = function(){

    // get information and construct the graph
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/HistoricalLocations?$expand=Locations").then(function(response){

      var res = response.data.value;


      locationData["HistoricalLocations"]["Longitude"]={
        label: "Historical Locations Longitude", 
        coordinateType: "Longitude",
        sourceType: "HistoricalLocations",
        show: true, 
        steppedLine: "after", 
        data: res.map(function(el){
          return ({x: el["time"], y: el.Locations[0]["location"]["coordinates"][0]})
        }),
        borderColor: "rgba(156,115,135,1)",
        fill: false, 
      }

      locationData["HistoricalLocations"]["Latitude"]={
        label: "Historical Locations Latitude", 
        coordinateType: "Latitude",
        sourceType: "HistoricalLocations",
        show: true, 
        steppedLine: "after", 
        data: res.map(function(el){
          return ({x: el["time"], y: el.Locations[0]["location"]["coordinates"][1]})
        }),
        borderColor: "rgba(115,135,156,1)",
        fill: false, 
      }

      locationData["HistoricalLocations"]["Altitude"] = {
        label: "Historical Locations Altitude", 
        coordinateType: "Altitude",
        sourceType: "HistoricalLocations",
        show: true, 
        steppedLine: "after", 
        data: res.filter(el => el.Locations[0]["location"]["coordinates"][2]).map(function(el){
            return {x: el["time"], y: el.Locations[0]["location"]["coordinates"][2]}
          }),
        borderColor: "rgba(135,156,115,1)",
        fill: false, 
      }

      var ctx = document.getElementById('LocationGraph').getContext('2d');
      locationChart = new Chart(ctx, {
          type: 'line',
          data: {
              //labels: resLabels,
              datasets:[locationData["HistoricalLocations"]["Longitude"],locationData["HistoricalLocations"]["Latitude"],locationData["HistoricalLocations"]["Altitude"]]
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
                  text: "Locations",
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

  $scope.toggleCoordinates = function(coord){
    $scope.locationtracedisplay[coord] = !$scope.locationtracedisplay[coord]
    console.log($scope.locationtracedisplay)
    Object.keys(locationData).forEach(function(source){
      locationData[source][coord]["show"] = ($scope.locationtracedisplay[coord] && $scope.locationtracedisplay[source])
    })

    $scope.updateChart()
  };


  $scope.toggleSource = function(source){
    //is done automatically by checkboxes
    //$scope.locationtracedisplay[source] = !$scope.locationtracedisplay[source]

    Object.keys(locationData[source]).forEach(function(coord){
      locationData[source][coord]["show"] = ($scope.locationtracedisplay[coord] && $scope.locationtracedisplay[source])
    })

    $scope.updateChart()
  }

  //function that checks all "show" flags in locationData and updates the chart
  $scope.updateChart = function(){
    locationChart.data.datasets = []
    Object.keys(locationData).forEach(function(key){
      Object.keys(locationData[key]).forEach(function(coordinateType){
        if(locationData[key][coordinateType]["show"]){
          locationChart.data.datasets.push(locationData[key][coordinateType])
        }
      })
    })
    locationChart.update();
  };











  $scope.FoItop=1000

  $scope.accumulationThreshold = 500 //in meters. change functions so that a threshold can be used

  var geocompare = function(x1,x2){
    return (x1==x2)
  };

  var accumulator = function(arr){
    let res=arr.reduce(function(acc,i){
      if(!geocompare(i["y"],acc[acc.length-1]["y"])){
        acc.push(i)
      }
      return(acc)
    },[arr[0]])

    return (res)
  }




  $scope.accumulateCoordinates(dsid){
    //need to work with looping through result times to identify which coordinates belong together and then reduce. also rework above functions to work with that
  }

  
  $scope.loadFoITrace = function(dsid){

    $scope.requestIsLoading[dsid] = true
    var skip = locationData[dsid]["Latitude"]["data"].length

    $.snackbar({content: "Requesting Data. This may take a bit.", timeout: 5000})
    // get information and add to dataset
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Datastreams('" + dsid + "')/Observations?$orderby=resultTime asc&$expand=FeatureOfInterest($select=feature)&$select=resultTime,FeatureOfInterest&$top=" + $scope.FoItop + "&$skip=" + skip).then(function(response){
      
      let res=response.data.value

      locationData[dsid]["Longitude"]["data"]=locationData[dsid]["Longitude"]["data"].concat(res.map(function(el){
        return ({x: el["resultTime"], y: el["FeatureOfInterest"]["feature"]["coordinates"][0]})
      }))

      locationData[dsid]["Latitude"]["data"]=locationData[dsid]["Latitude"]["data"].concat(res.map(function(el){
        return ({x: el["resultTime"], y: el["FeatureOfInterest"]["feature"]["coordinates"][1]})
      }))
      
      locationData[dsid]["Altitude"]["data"]=locationData[dsid]["Altitude"]["data"].concat(res.filter(el => el["FeatureOfInterest"]["feature"]["coordinates"][2]).map(function(el){
        return ({x: el["resultTime"], y: el["FeatureOfInterest"]["feature"]["coordinates"][2]})
      }))


      $scope.updateChart()
      $scope.requestIsLoading[dsid] = false
    });
  };

});