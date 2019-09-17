gostApp.controller('DatastreamsCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('DATASTREAMS');
    $scope.Page.setHeaderIcon(iconDatastream);

    if(! "$orderby" in $routeParams) $routeParams["$orderby"]="name asc";


    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Datastreams"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    $http.get(query).then(function (response) {
        $scope.datastreamsList = response.data.value;
    });
    
    //Without Query Language
    /*
    $http.get(getUrl() + "/v1.0/Datastreams").then(function (response) {
        $scope.datastreamsList = response.data.value;
    });
    */

    $scope.datastreamClicked = function (datastreamID) {
        angular.forEach($scope.datastreams, function (value, key) {
            if (value["@iot.id"] == datastreamID) {
                $scope.Page.selectedDatastream = value;
            }
        });

        $scope.Page.go("datastream/" + datastreamID);
    };

    $scope.addNewDatastream = function(newDatastream) {
        var res = $http.post(getUrl() + '/v1.0/Datastreams', newDatastream);
        res.success(function(data, status, headers, config) {
            alert( "added: " + JSON.stringify({data: data}));
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };

    $scope.deleteDatastreamClicked = function (entity) {
        var res = $http.delete(getUrl() + '/v1.0/Datastreams(' + getId(entity["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.datastreamsList.indexOf(entity);
            $scope.datastreamsList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };
});
