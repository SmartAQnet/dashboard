gostApp.controller('HomeCtrl', function ($scope, $http) {
    $scope.Page.setTitle('smartAQnet');
    $scope.Page.setHeaderIcon('');
    
    $http.get(getUrl() + "/v1.0/Things?$filter=datastreams/Observations/phenomenontime%20gt%20now()%20sub%20duration%27P1d%27&$count=true").then(function (response) {
        $scope.active_devices = response.data["@iot.count"];
    });

    $http.get(getUrl() + "/v1.0/Observations?$top=0&$count=true").then(function (response) {
        $scope.n_observations = response.data["@iot.count"];
    });

});