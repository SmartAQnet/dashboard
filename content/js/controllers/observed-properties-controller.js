gostApp.controller('ObservedPropertiesCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('OBSERVED PROPERTIES');
    $scope.Page.setHeaderIcon(iconObservedProperty);

    if(! "$orderby" in $routeParams) $routeParams["$orderby"]="name asc";

    var query=getUrl() + "/v1.0/ObservedProperties"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    $http.get(query).then(function (response) {
        $scope.observedpropertiesList = response.data.value;
    });

    $scope.observedpropertyClicked = function (observedpropertyID) {
        angular.forEach($scope.observedproperties, function (value, key) {
            if (value["@iot.id"] == observedpropertyID) {
                $scope.Page.selectedObservedProperty = value;
            }
        });

        $scope.Page.go("observedproperty/" + observedpropertyID);
    };

    // $scope.addNewThing = function(newThing) {
    //     var res = $http.post(getUrl() + '/v1.0/Things', newThing);
    //     res.success(function(data, status, headers, config) {
    //         alert( "added: " + JSON.stringify({data: data}));
    //     });
    //     res.error(function(data, status, headers, config) {
    //         alert( "failure: " + JSON.stringify({data: data}));
    //     });
    // };

     $scope.deleteObservedPropertyClicked = function (entity) {
        var res = $http.delete(getUrl() + '/v1.0/ObservedProperty(' + getId(entity["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.observedpropertiesList.indexOf(entity);
            $scope.observedpropertiesList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
     };
});
