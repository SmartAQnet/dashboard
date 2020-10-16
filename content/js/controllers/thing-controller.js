gostApp.controller('ThingCtrl', function ($scope, $http, $routeParams, $location, $timeout, $rootScope, $window, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('THING(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);

    $scope.category = 'Thing'

    //toggle map displays
    $scope.showMapControls = false

    //pagination example for ng-repeat tables
    //http://jsfiddle.net/2ZzZB/56/

    //remove query params
    $location.search({})

    //populate the map with all things
    $scope.$on("mapIsReady", function(){
      $http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastreams/phenomenonTime%20lt%20now()%20sub%20duration%27P1d%27&$expand=Locations").then(function (response) {
        $rootScope.$broadcast("addToMap",response.data.value)
      });
    });

    //Load Data
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")?$expand=Locations").then(function (response) {
  
      $scope.name = response.data["name"];
      $scope.description = response.data["description"];
      $scope.properties = response.data["properties"];
      $scope.Page.selectedThing = response.data;
      $scope.showMap = true;

      $scope.locationsList = response.data["Locations"];

      if($scope.locationsList.length!= 0){

        //waits until the map is ready, then sends request to change the style and center the view on the current thing
        //for some reason still needs the timeout to apply the new marker style
        $scope.$on("featuresAreReady",function(evt,data){
          $timeout(function(){
            console.log("Requested changing style of " + $scope.id + " to red")
            $rootScope.$broadcast('changeFeatureStyle',{"@iot.id": $scope.id, "style": "red"})
            $rootScope.$broadcast('centerOn',$scope.locationsList[0]["location"])
          },200)
        });

      } else {
        console.log("no location defined, please use 'move to new location' to define one")
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


  /**
   * Next is the block that deals with the GPS Graphs under the "Historical Location" card of the thing
   */


  //initiate variables 

  $scope.locationtracedisplay = {"Latitude": true, "Longitude": true, "Altitude": true, "HistoricalLocations": true}
  var locationData = {"HistoricalLocations": {"Longitude": {}, "Latitude": {}, "Altitude": {}}}
  $scope.requestIsLoading={}

  $scope.FoItop=1000
  $scope.FoIstart = ''
  $scope.FoIend = ''

  $scope.FoIdisplay = {}
  $scope.FoIdisplay.datalist = {}
  $scope.FoIdisplay.count = {}
  $scope.FoIdisplay.skip = {}
  $scope.FoIdisplay.currentcount = {}
  $scope.FoIdisplay.nextLink = {}

  $scope.accumulationThreshold = 500 //in meters. change functions so that a threshold can be used


  $scope.refreshTop = function(dsid){
    if($scope.FoIdisplay.nextLink[dsid].includes("$top")){
      let firsthalf = $scope.FoIdisplay.nextLink[dsid].split("$top=")[0]
      let remainder = $scope.FoIdisplay.nextLink[dsid].split("$top=")[1].split("&$").slice(1).join("&$")

      $scope.FoIdisplay.nextLink[dsid] = firsthalf + "$top=" + $scope.FoItop + "&$" + remainder
    } else {
      $scope.FoIdisplay.nextLink[dsid] = $scope.FoIdisplay.nextLink[dsid] + "&" + "$top=" + $scope.FoItop
    }
    console.log("Top has been updated")
    console.log($scope.FoIdisplay.nextLink[dsid])

  }

  //intiate datastream specific variables
  $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Datastreams").then(function(response){

    $scope.datastreamsList = response.data.value;
    $scope.datastreamsList.forEach(function(ds){
      
      var dsid = ds["@iot.id"]

      $scope.FoIdisplay.nextLink[dsid] = getUrl() + "/v1.0/Datastreams('" + dsid + "')/Observations?$orderby=resultTime asc&$expand=FeatureOfInterest($select=feature)&$select=resultTime,FeatureOfInterest&$top=" + $scope.FoItop + "&$skip=0"
      $scope.FoIdisplay.currentcount[dsid] = 0
      $scope.FoIdisplay.datalist[dsid]=[]
      
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
          steppedLine: "before", 
          data: [],
          borderColor: "rgba(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ",1)",
          fill: false, 
        }
      })
    });

  });


  //function that initiates the graph with Historical Location Data
  $scope.loadLocationTrace = function(){

    // get information and construct the graph
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/HistoricalLocations?$expand=Locations").then(function(response){

      var res = response.data.value;


      locationData["HistoricalLocations"]["Longitude"]={
        label: "Historical Locations Longitude", 
        coordinateType: "Longitude",
        sourceType: "HistoricalLocations",
        show: true, 
        steppedLine: "before", 
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
        steppedLine: "before", 
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
        steppedLine: "before", 
        data: res.filter(el => el.Locations[0]["location"]["coordinates"][2]).map(function(el){
            return {x: el["time"], y: el.Locations[0]["location"]["coordinates"][2]}
          }),
        borderColor: "rgba(135,156,115,1)",
        fill: false, 
      }

      var canvas = document.getElementById('LocationGraph')
      var ctx = canvas.getContext('2d');

      locationChart = new Chart(ctx, {
          type: 'line',
          data: {
              //labels: resLabels,
              datasets:[locationData["HistoricalLocations"]["Longitude"],locationData["HistoricalLocations"]["Latitude"],locationData["HistoricalLocations"]["Altitude"]]
          }, 
          options: {
            tooltips: {
              mode: 'x',
              intersect: false
              },
              hover: {
                  mode: 'x',
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
                        tooltipFormat: 'YYYY-MM-DD HH:mm:ss', 
                        displayFormats: {
                          'millisecond': 'YYYY-MM-DD HH:mm:ss',
                          'second': 'YYYY-MM-DD HH:mm:ss',
                          'minute': 'YYYY-MM-DD HH:mm:ss',
                          'hour': 'YYYY-MM-DD HH:mm:ss',
                          'day': 'YYYY-MM-DD HH:mm:ss',
                          'week': 'YYYY-MM-DD HH:mm:ss',
                          'month': 'YYYY-MM-DD HH:mm:ss',
                          'quarter': 'YYYY-MM-DD HH:mm:ss',
                          'year': 'YYYY-MM-DD HH:mm:ss'
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

      canvas.onclick = function(evt) {
        var activePoints = locationChart.getElementsAtXAxis(evt);
        if(activePoints[0]){
          //console.log(activePoints[0])
            var idx = activePoints[0]['_index'];
            var res = {}

            var sets = activePoints[0]['_chart'].config.data.datasets

            sets.map(function(el){
              res[el.sourceType] = {}
            })

            sets.forEach(function(dataset){
              if(dataset.data[idx]){
                res[dataset.sourceType][dataset.coordinateType]=dataset.data[idx]["y"]
                res[dataset.sourceType]["Timestamp"]=dataset.data[idx]["x"] //overwrites but is ok since its the same timestamp for lat lon alt
              }
            })
  
            console.log("------------")
            Object.keys(res).forEach(function(st){
              console.log(st)
              console.log(res[st])
              if(res[st]["Latitude"] && res[st]["Longitude"]){
                console.log("Check on googlemaps:")
                console.log("http://www.google.com/maps/place/" + res[st]["Latitude"] + "," + res[st]["Longitude"])
              }
              console.log("------------")
            })


        }
      }

    });
  };



  $scope.loadLocationTrace()

  $scope.toggleCoordinates = function(coord){
    $scope.locationtracedisplay[coord] = !$scope.locationtracedisplay[coord]
    Object.keys(locationData).forEach(function(source){
      locationData[source][coord]["show"] = ($scope.locationtracedisplay[coord] && $scope.locationtracedisplay[source])
    });

    $scope.updateChart()
  };

  $scope.onToggleSource = function(dsid){

    //load total count only when the datastream is checked the first time
    if(!$scope.FoIdisplay.count[dsid] && dsid!="HistoricalLocations"){
      $http.get(getUrl() + "/v1.0/Datastreams('" + dsid + "')/Observations?$top=1&$count=True").then(function(response){
        $scope.FoIdisplay.count[dsid] = parseInt(response.data["@iot.count"])
      });
    }

    Object.keys(locationData[dsid]).forEach(function(coord){
      locationData[dsid][coord]["show"] = ($scope.locationtracedisplay[coord] && $scope.locationtracedisplay[dsid])
    });

    $scope.updateChart()
  };

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






  //function that compares the two-dimensional distance between two lat-lon tuples, returns true when it concludes its the same (within errors) and false when its different points
  var geocompare = function(ar1,ar2){
    let lon1 = ar1[0]
    let lon2 = ar2[0]
    let lat1 = ar1[1]
    let lat2 = ar2[1]

    let londiff = Math.abs(lon1-lon2) * 111320 * Math.cos(lat1) //assuming lat1 and lat2 are close enough
    let latdiff = Math.abs(lat1-lat2) * 111320 //gives latitude difference in meters

    let dist = Math.sqrt(londiff*londiff + latdiff*latdiff)

    //let cond = ar1[0]==ar2[0] && ar1[1]==ar2[1]
    let cond = dist < $scope.accumulationThreshold
    
    if(dist>0){
      console.log(dist)
    }
    
    return (cond)
  };

  //takes an array of the form [{..., y: [lon,lat,(alt)]}, ...] and produces a new array without adjacent duplicates in gps values
  var accumulator = function(arr){
    console.log("Distances > 0 between successive GPS Coordinates in meters")
    let res=arr.reduce(function(acc,el){
      if(!geocompare(el["y"],acc[acc.length-1]["y"])){
        acc.push(el)
      }
      return(acc)
    },[arr[0]])

    console.log("Resulting Array of Locations with Timestamps")
    console.log(res)
    return (res)
  };
  

  //triggers the accumulation function on the loaded data of the respective datastream
  $scope.accumulateCoordinates = function(dsid){
    if($scope.FoIdisplay.datalist[dsid]){
    $scope.FoIdisplay.datalist[dsid] = accumulator($scope.FoIdisplay.datalist[dsid])
    upLocData(dsid)
    } else {
      alert("Nothing to Accumulate. Please load data first.")
    }
  }

  //"load all and accumulate" function? -> load chunk, accumulate, load next chunk, accumulate... meanwhile update view on progress. break if theres too many remaining after accumulation. 

  
  //update the chart data (and refresh the chart view)
  var upLocData = function(dsid){
    locationData[dsid]["Longitude"]["data"]=$scope.FoIdisplay.datalist[dsid].map(function(el){
      return ({x: el["x"], y: el["y"][0]})
    })
    locationData[dsid]["Latitude"]["data"]=$scope.FoIdisplay.datalist[dsid].map(function(el){
      return ({x: el["x"], y: el["y"][1]})
    })
    locationData[dsid]["Altitude"]["data"]=$scope.FoIdisplay.datalist[dsid].filter(el => el["y"][2]).map(function(el){
      return ({x: el["x"], y: el["y"][2]})
    })

    $scope.updateChart()
  }

  //load FeatureOfInterest Data of datastream
  $scope.loadFoITrace = function(dsid){
    console.log("old nextlink")
    console.log($scope.FoIdisplay.nextLink[dsid])
    //if there is a (next)Link to load
    if($scope.FoIdisplay.nextLink[dsid]){

      $scope.requestIsLoading[dsid] = true

      $scope.refreshTop(dsid)

      $.snackbar({content: "Requesting Data. This may take a bit.", timeout: $scope.FoItop*10})

      // get information and add to dataset
      $http.get($scope.FoIdisplay.nextLink[dsid]).then(function(response){
        if(response.data.value.length>0){

          console.log("link that has just now been loaded")
          console.log($scope.FoIdisplay.nextLink[dsid])
          //retrieve skip parameter and calculate the current amount of loaded datapoints for display
          $scope.FoIdisplay.skip[dsid] = parseInt($scope.FoIdisplay.nextLink[dsid].split("$skip=")[1].split("&$")[0])

          if($scope.FoIdisplay.skip[dsid] + $scope.FoItop > $scope.FoIdisplay.count[dsid]){
            $scope.FoIdisplay.currentcount[dsid] = $scope.FoIdisplay.count[dsid]
          } else {
            $scope.FoIdisplay.currentcount[dsid] = $scope.FoIdisplay.skip[dsid] + $scope.FoItop
          }

          //get the next nextlink
          if(response.data["@iot.nextLink"]){
            $scope.FoIdisplay.nextLink[dsid] = response.data["@iot.nextLink"]
          } else {
            $scope.FoIdisplay.nextLink[dsid] = false
          }

          console.log("the new nextlink for next request. If you change the chunk size, top parameter will update on the loading request.")
          console.log($scope.FoIdisplay.nextLink[dsid])

          //attach loaded data to the array of datapoints
          $scope.FoIdisplay.datalist[dsid]=$scope.FoIdisplay.datalist[dsid].concat(response.data.value.map(function(el){
            return ({x: el["resultTime"], y: el["FeatureOfInterest"]["feature"]["coordinates"]})
          }));

          //update the graph
          upLocData(dsid)
                
          $scope.requestIsLoading[dsid] = false

        } else {
          $scope.requestIsLoading[dsid] = false
          $.snackbar({content: "No Datapoints in this iterval.", timeout: 3000})
        };

      });
    } else {
      $.snackbar({content: "No more Datapoints for this request.", timeout: 3000})
    }
  };




  $(function() {
    $('#FoIcalendar').daterangepicker({
        autoUpdateInput: false,
        locale: {
            cancelLabel: 'Clear'
        }
    });
    
    $('#FoIcalendar').on('apply.daterangepicker', function(ev, picker) {
      $(this).val(picker.startDate.format('YYYY-MM-DD') + " - " + picker.endDate.format('YYYY-MM-DD'));
      $scope.FoIstart = picker.startDate.toISOString()
      $scope.FoIend = picker.endDate.toISOString()

      Object.keys($scope.locationtracedisplay).filter(el => el!="Latitude" && el != "Longitude" && el!= "Altitude" && el != "HistoricalLocations").forEach(function(dsid){
        $scope.FoIdisplay.nextLink[dsid] = getUrl() + "/v1.0/Datastreams('" + dsid + "')/Observations?$orderby=resultTime asc&$expand=FeatureOfInterest($select=feature)&$select=resultTime,FeatureOfInterest&$top=" + $scope.FoItop + "&$filter=resultTime gt " + $scope.FoIstart + " and resultTime lt " + $scope.FoIend + "&$skip=0"
        if($scope.locationtracedisplay[dsid]){
          $scope.FoIdisplay.datalist[dsid]=[]
          upLocData(dsid)
        }
        });

      });

    $('#FoIcalendar').on('cancel.daterangepicker', function(ev, picker) {
      $(this).val('');
      $scope.FoIstart = ''
      $scope.FoIend = ''

      Object.keys($scope.locationtracedisplay).filter(el => el!="Latitude" && el != "Longitude" && el!= "Altitude" && el != "HistoricalLocations").forEach(function(dsid){
        $scope.FoIdisplay.nextLink[dsid] = getUrl() + "/v1.0/Datastreams('" + dsid + "')/Observations?$orderby=resultTime asc&$expand=FeatureOfInterest($select=feature)&$select=resultTime,FeatureOfInterest&$top=" + $scope.FoItop + "&$skip=0"
        if($scope.locationtracedisplay[dsid]){
          $scope.FoIdisplay.datalist[dsid]=[]
          upLocData(dsid)
        }

      });

    });

  });



});