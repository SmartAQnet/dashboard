gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";

    var query=getUrl() + "/v1.0/Things"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    $http.get(query).then(function (response) {
        $scope.thingsList = response.data.value;
    });

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
