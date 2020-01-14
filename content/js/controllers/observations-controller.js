gostApp.controller('ObservationsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('OBSERVATIONS');
    $scope.Page.setHeaderIcon(iconObservation);
    $scope.datastreamid = $routeParams.id;

    $http.get(getUrl() + "/v1.0/Datastreams('" + $scope.datastreamid + "')").then(function (response) {
        $scope.currentdatastream = response.data
        $scope.uOM = $scope.currentdatastream["unitOfMeasurement"]   
    });

    //defaults
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="phenomenonTime desc";

    if(!("$top" in $routeParams)){
        $scope.newTop = 50;
        $route.updateParams({'$top':$scope.newTop});
    } else {$scope.newTop = $routeParams["$top"]}


    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Datastreams('" + $scope.datastreamid + "')/Observations"+ Object.keys($routeParams).filter(key => key.startsWith("$")).reduce(
        (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 


    /** General functions that should be available in a parent controller */

    console.log(query)
    $http.get(query).then(function (response) {

        if($routeParams['$top']){
            $scope.newTop = $routeParams['$top']
        };

        if($routeParams['$skip']){
            $scope.thisLinkSkip = $routeParams['$skip']
        };

        $scope.observationsList = response.data.value;
        if(response.data["@iot.nextLink"]){
            $scope.nextLinkSkip = (response.data['@iot.nextLink']).match(/(?:skip=)([0-9]+)/)[1]
        } else {
            $scope.nextLinkSkip = 0
        };
    });
    
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

    /** up to here. */









    /*
     $scope.deleteObservationClicked = function (entity) {
        var res = $http.delete(getUrl() + '/v1.0/Observations(' + getId(entity["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.observationsList.indexOf(entity);
            $scope.observationsList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
     };*/
});
