gostApp.controller('ObservationsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('OBSERVATIONS');
    $scope.Page.setHeaderIcon(iconObservation);
    $scope.datastreamid = $routeParams.id;


    

    /*
    $scope.faasurl = "http://193.196.36.99:8080/function/thing-to-csv?thingid={{thingid}}&from_date={{from}}&to_date={{to}}&download={{thingid}}"

    $scope.faasquery = {}
    $scope.faasquery.thingid
    */

    //get Unit of Measurement from parent Datastream
    $http.get(getUrl() + "/v1.0/Datastreams('" + $scope.datastreamid + "')").then(function (response) {
        $scope.currentdatastream = response.data
        $scope.uOM = $scope.currentdatastream["unitOfMeasurement"]   
    });

    //defaults
    // --- select query parameters, set default when no select parameter is given; then provide function that updates url

    if("$select" in $routeParams){
        $route.current.params["$select"].split(",").forEach(val => $scope.selectparams[val] = true)
    } else {
        $scope.selectparams.resultTime = true;
        $scope.selectparams.phenomenonTime = true;
        $scope.selectparams.result = true;
    }



    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="phenomenonTime desc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";




    


    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Datastreams('" + $scope.datastreamid + "')/Observations"+ Object.keys($routeParams).filter(key => key.startsWith("$")).reduce(
        (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 


    $scope.loadTable(query);
    
    








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
