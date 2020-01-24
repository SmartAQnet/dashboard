gostApp.controller('ObservationsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('OBSERVATIONS');
    $scope.Page.setHeaderIcon(iconObservation);


    if($scope.selectparams.obs.resultTime == undefined){$scope.selectparams.obs.resultTime = true};
    if($scope.selectparams.obs.result == undefined){$scope.selectparams.obs.result = true};
    if($scope.selectparams.obs.phenomenonTime == undefined){$scope.selectparams.obs.phenomenonTime = true};
    

    //watch select parameters that dont make sense without expanding
    $scope.expandparams.obs.FeatureOfInterest = $scope.selectparams.obs.FeatureOfInterest;
    $scope.$watch("selectparams.obs['FeatureOfInterest']", function(newval,oldval){
        $scope.expandparams.obs.FeatureOfInterest = newval
    });

    $scope.expandparams.obs.Datastream = $scope.selectparams.obs.Datastream;
    $scope.$watch("selectparams.obs['Datastream']", function(newval,oldval){
        $scope.expandparams.obs.Datastream = newval
    });



    /* //faas sollte hier "einfach" die ganze tabelle runterladen mit datastream name/id/...? (auswählbar?) als column header
    $scope.faasurl = "http://193.196.36.99:8080/function/thing-to-csv?thingid={{thingid}}&from_date={{from}}&to_date={{to}}&download={{thingid}}"

    $scope.faasquery = {}
    $scope.faasquery.thingid
    */

    //get Unit of Measurement from parent Datastream
    $scope.getuOM = function(ds){
        $http.get(getUrl() + "/v1.0/Datastreams('" + ds + "')").then(function (response) {
            return(response.data["unitOfMeasurement"])
        });
    };

    //defaults
    /*
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="phenomenonTime desc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    */


    //filter query language for datastream ids... ist das eindeutig wie die logischen verknüpfungen funktionieren?
    //?$filter=Datastream/@iot.id eq 'saqn:ds:d811458' or Datastream/@iot.id eq 'saqn:ds:d2df547' and resultTime ge 2020-01-01T01:00:00.000Z
    


    //Implement Server Query Language in Static urls
    $scope.obsquery=getUrl() + "/v1.0/Observations"+ Object.keys($routeParams).filter(key => key.startsWith("$")).reduce(
        (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 


    //put on ng click in view; button greyed out when not at least one datastream is selected
    //$scope.loadTable($scope.obsquery,'obs');
    
    

    $scope.checkAllDsOfThing = function(thingid){
        $http.get(getUrl() + "/v1.0/Things('" + thingid + "')/Datastreams").then(function (response) {
            response.data.value.forEach(datastream =>{
                $scope.filterparamsID.obs[datastream["@iot.id"]] = !$scope.filterparamsID.obs[datastream["@iot.id"]]
            });
        });
    };


    $scope.loadListOfThings = function(){

        $http.get(getUrl() + "/v1.0/Things?$expand=Datastreams").then(function (response){
            $scope.listOfThings = response.data.value
            
            if(response.data["@iot.nextLink"]){
                var link = response.data["@iot.nextLink"]
                while(link){
                    $http.get(link).then(function (resp){
                        $scope.listOfThings.push(resp.data.value)
                        if(resp.data["@iot.nextLink"]){
                            link = resp.data["@iot.nextLink"]
                        } else {
                            link = false
                        };
                    });
                };
            };
        });
    };



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
