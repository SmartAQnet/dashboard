gostApp.controller('ThingCtrl', function ($scope, $http, $routeParams, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('THING(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);

    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")?$expand=Locations").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.properties = response.data["properties"];
        $scope.Page.selectedThing = response.data;
        $scope.location = response.data["Locations"][0]["location"]["coordinates"];
        $scope.showMap = true;
    });
    $scope.mapVisible = true;
    
    $scope.tabPropertiesClicked = function () {
    };

    //display location in another color --> change color of the respective pin (old code, doesnt work anymore, build from scratch)
    // $scope.tabLocationsClicked = function () {

    //     $http.get(getUrl() + "/v1.0/Things(" + getId($scope.Page.selectedThing["@iot.id"]) + ")/Locations").then(function (response) {
    //         $scope.locationsList = response.data.value;
    //         PinLayer.getSource().clear();
    //         addGeoJSONFeature($scope.locationsList[0]["location"]);
    //         setview($scope.locationsList[0]["location"]["coordinates"]);
    //     });
    // };

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
});
