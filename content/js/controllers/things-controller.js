gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);

    //defaults
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";

    if(!("$top" in $routeParams)){
        $scope.newTop = 50;
        $route.updateParams({'$top':$scope.newTop});
    } else {$scope.newTop = $routeParams["$top"]}

    
    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Things"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 






    /** General functions that should be available in a parent controller */

    $http.get(query).then(function (response) {

        if($routeParams['$top']){
            $scope.newTop = $routeParams['$top']
        };

        if($routeParams['$skip']){
            $scope.thisLinkSkip = $routeParams['$skip']
        };

        $scope.thingsList = response.data.value;
        if(response.data["@iot.nextLink"]){
            $scope.nextLinkSkip = (response.data['@iot.nextLink']).match(/(?:skip=)([0-9]+)/)[1]
        } else {
            $scope.nextLinkSkip = 0
        };
    });

    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */

    
    $scope.keyIsSelected = function(key, def=true){
        if ($routeParams['$select']){
            if($routeParams['$select'].split(',').includes(key)){ 
                return true //if key present, return true
            } else {
                return false //if key not present, return false
            }
        } else {
            return def //if no select parameter is given, return the given default, if no default given, return true (~no select is equal to show all)
        }
    };

    $scope.followNextLink = function(){
        $route.updateParams({'$skip':$scope.nextLinkSkip});
    };

    $scope.followPreviousLink = function(){
        let skip = $scope.thisLinkSkip - $scope.newTop
        if(skip < 0){skip = 0}
        $route.updateParams({'$skip': skip})
    };

    $scope.setNewTop = function(){
        $route.updateParams({'$top':$scope.newTop})
    };

    /** up to here. actually the next one (or the next three) aswell */
    
    $scope.thingClicked = function (thingID) {
        angular.forEach($scope.things, function (value, key) {
            if (value["@iot.id"] == thingID) {
                $scope.Page.selectedThing = value;
            }
        });

        $scope.Page.go("thing/" + thingID);
    };

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
});