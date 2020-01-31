gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);


    //pure table manipulation, select isnt transported into the query
    if($scope.selectparams.things.name == undefined){$scope.selectparams.things.name = true};
    if($scope.selectparams.things.description == undefined){$scope.selectparams.things.description = true};
    if($scope.selectparams.things.Locations == undefined){$scope.selectparams.things.Locations = true};
    if($scope.selectparams.things.Datastreams == undefined){$scope.selectparams.things.Datastreams = true};

    //expand stuff per default (expand IS necessarily transported into the query)
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
        $scope.$parent.selectedDatastreamIds = Object.keys($scope.selectedDatastreams).filter(key => $scope.selectedDatastreams[key] == true)
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.$parent.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
    }, true);

    

    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */


   
    $scope.loadTable(query,'things');
    



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
        console.log("callback")
        $scope.timeframe.from = start.toISOString()
        $scope.timeframe.to = end.toISOString()
        $scope.selectedTimeframe = "(resultTime ge " + $scope.timeframe.from + " and resultTime le " + $scope.timeframe.to + ")"
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.$parent.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
        //$scope.$digest() cant use digest or apply here because it will throw an error that says cant use two applys. without apply, it doenst update observationsQuery though. put it on a fucking button. 
    }

    pushDateToQuery(moment().subtract(24, 'hour'),window.moment())
    

});