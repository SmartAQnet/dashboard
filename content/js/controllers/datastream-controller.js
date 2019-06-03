gostApp.controller('DatastreamCtrl', function ($scope, $http, $routeParams, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('DATASTREAM(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconDatastream);

    var datastreams = new Datastreams($http);
    var onDataChangeUpdater = function(){
        //$scope.$apply();
        //Todo: Change something if new data is available
    }
    datastreams.addDataChangeListener(onDataChangeUpdater);

    $scope.$on("$destroy", function () {
        datastreams.removeAllStreams();
        datastreams.disconnectMQTTClient();
        datastreams.removeDataChangeListener(onDataChangeUpdater);
    });

    //Initialize Thing ID and Description for Back Button
    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Thing").then(function (response) {
        $scope.thingId = response.data["@iot.id"];
        $scope.thingName = response.data["name"];
    });

    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.unitOfMeasurement = response.data["unitOfMeasurement"];
        $scope.observedArea = response.data["observedArea"];
        $scope.Page.selectedDatastream = response.data;
    });

    $scope.tabPropertiesClicked = function () {

    };

    $scope.tabThingClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Thing").then(function (response) {
            $scope.thingId = response.data["@iot.id"];
            $scope.thingDescription = response.data["description"];
            $scope.thingProperties = response.data["properties"];
        });
    };

    $scope.tabSensorClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Sensor").then(function (response) {
            $scope.sensorId = response.data["@iot.id"];
            $scope.sensorDescription = response.data["description"];
            $scope.sensorEncoding = response.data["encodingType"];
            $scope.sensorMetadata = response.data["metadata"];
        });
    };

    $scope.tabObservationsClicked = function () {
        $scope.observationsList = datastreams.addStream($scope.id).dataset;
        datastreams.toChart("#observationChart");
    };

	$scope.tabObservedPropertyClicked = function () {
		$http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/ObservedProperty").then(function (response) {
			$scope.observedPropertyId = response.data["@iot.id"];
            $scope.observedPropertyName = response.data["name"];
            $scope.observedPropertyDescription = response.data["description"];
            $scope.observedPropertyDefinition = response.data["definition"];
        });
    };

    $scope.showThingSelection = function() {
        $scope.modalState = "thingSelection";
        var query=getUrl() + "/v1.0/Things";
    
        $http.get(query).then(function (response) {
            $scope.thingsList = response.data.value;
        });
    }

    $scope.showDatastreamsForThing = function(thingId) {
        $scope.secondThingId = thingId;
        $scope.modalState = "datastreamSelection";
        $http.get(getUrl() + "/v1.0/Things(" + getId(thingId) + ")/Datastreams?$expand=ObservedProperty").then(function (response) {
            $scope.datastreamsList = response.data.value;
        });
    }

    $scope.datastreamClicked = function(datastreamId) {
        /*TODO: Prepare datastream for diagram*/
        console.log("Add " + datastreamId + "to diagram");
        datastreams.addStream(datastreamId);
        datastreams.toChart("#observationChart");
        $('#thingSelection').trigger('click');
    }
});
