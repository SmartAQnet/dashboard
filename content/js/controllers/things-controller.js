gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);

    //defaults
    // --- grab query parameters and set scope variables
    
    if($scope.selectparams.name == undefined){$scope.selectparams.name = true};
    if($scope.selectparams.description == undefined){$scope.selectparams.description = true};
    if($scope.selectparams.Locations == undefined){$scope.selectparams.Locations = true};


    //watch select parameters that dont make sense without expanding
    $scope.expandparams.Locations = $scope.selectparams.Locations;
    $scope.$watch("selectparams['Locations']", function(newval,oldval){
        $scope.expandparams.Locations = newval
    });

    $scope.expandparams.HistoricalLocations = $scope.selectparams.HistoricalLocations;
    $scope.$watch("selectparams['HistoricalLocations']", function(newval,oldval){
        $scope.expandparams.HistoricalLocations = newval
    });

    $scope.expandparams.Datastreams = $scope.selectparams.Datastreams;
    $scope.$watch("$parent.selectparams['Datastreams']", function(newval, oldval){
        $scope.expandparams.Datastreams = newval
    });

    //default parameters that used in the query but hidden from the url 
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    // ---

    
    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Things"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 


    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */


 
    

   
    $scope.loadTable(query);
    




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




});