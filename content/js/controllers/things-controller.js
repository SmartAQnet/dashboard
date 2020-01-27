gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);


    //pure table manipulation, select isnt transported into the query
    if($scope.selectparams.things.name == undefined){$scope.selectparams.things.name = true};
    if($scope.selectparams.things.description == undefined){$scope.selectparams.things.description = true};
    if($scope.selectparams.things.Locations == undefined){$scope.selectparams.things.Locations = true};
    if($scope.selectparams.things.Datastreams == undefined){$scope.selectparams.things.Datastreams = true};

    //expand stuff per default (expand IS necessarily transported into the query transported into )
    $scope.expandparams.things.Locations = true;
    $scope.expandparams.things.HistoricalLocations = true;
    $scope.expandparams.things.Datastreams = true;


    //default parameters that used in the query but hidden from the url 
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    // ---

    
    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Things" + Object.keys($routeParams).reduce((a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    //build query for observations
    $scope.$watch('selectedDatastreams', function () {
        $scope.selectedDatastreamIds = Object.keys($scope.selectedDatastreams).filter(key => $scope.selectedDatastreams[key] == true)
        $scope.observationsQuery = "?$filter=" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ')
    }, true);

    $scope.$watch('selectedTimeframe', function () {
        $scope.observationsQueryTime  = "?$filter=" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ')
    }, true);
    

    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */

    $scope.checkMyDs = {}

    /*
    $scope.selectDatastream = function(id){
        if($scope.selectedDatastreams[id]){
            $scope.selectedDatastreams[id] = false
        } else {
            $scope.selectedDatastreams[id] = true
        }
        console.log($scope.selectedDatastreams[id])
        console.log(id)
        $scope.selectedDatastreams[id] = !$scope.selectedDatastreams[id]
    }
    */

    $scope.checkAllDsOfThing = function(thingid){
        $scope.checkMyDs[thingid] = !$scope.checkMyDs[thingid]
        $scope.dataList.forEach(thing => {
            if(thing["@iot.id"] == thingid){
                thing["Datastreams"].forEach(datastream => {
                    $scope.selectedDatastreams[datastream["@iot.id"]] = $scope.checkMyDs[thingid]
                });
            };
        });
    };
   
    $scope.loadTable(query,'things');
    


    //function that builds the observations query and routes to the observations page
    $scope.showObservations = function(){
        
        if($scope.selectedDatastreamIds.length == 0){
            $.snackbar({content: "Please select at least one Datastream to view Observations"})
        } else {
            console.log($scope.selectedDatastreamIds)
            console.log($scope.selectedTimeframe)
            //$scope.Page.go("observations" + $scope.observationsQuery);
        }
    }

    /*
    $scope.addNewThing = function(newThing) {
        var res = $http.post(getUrl() + '/v1.0/Things', newThing);
        res.success(function(data, status, headers, config) {
            alert( "added: " + JSON.stringify({data: data}));
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };

    $scope.deleteThingClicked = function (entity) {
        var res = $http.delete(getUrl() + '/v1.0/Things(' + getId(entity["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.thingsList.indexOf(entity);
            $scope.thingsList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };
    */

    
   var nowMoment = moment();

    $(function() {
        $('#calendar').daterangepicker({
            timePicker: true,
            timePicker24Hour: true,
            startDate: moment(),
            endDate: moment().subtract(24, 'hour'),
            drops: "up",
                    ranges: {
                        'Latest': [nowMoment, nowMoment],
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
        $scope.selectedTimeframe = "&$resultTime ge " + start.toISOString() + " and resultTime le " + end.toISOString()
    }


});