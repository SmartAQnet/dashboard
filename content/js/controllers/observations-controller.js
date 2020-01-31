gostApp.controller('ObservationsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('OBSERVATIONS');
    $scope.Page.setHeaderIcon(iconObservation);


    /*
    var query=getUrl() + "/v1.0/Observations" + Object.keys($routeParams).filter(key => key.startsWith("$")).reduce(
        (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 
        */

    let filterarray = $routeParams["$filter"].replace(/\)/g,"").replace(/\(/g,"").split(" and ").join(" SEPARATOR ").split(" or ").join(" SEPARATOR ").split(" SEPARATOR ")

    var starttime
    var endtime
    $scope.datastreamIds = []

    filterarray.forEach(el => {
        if(el.startsWith("resultTime ge ")){
            starttime = el.slice("resultTime ge ".length)
        } else if(el.startsWith("resultTime le ")){
            endtime = el.slice("resultTime le ".length)
        } else if(el.startsWith("Datastream/@iot.id eq ")){
            $scope.datastreamIds.push(el.replace("Datastream/@iot.id eq ","").replace(/\'/g,""))
        }
    })

    console.log(starttime)
    console.log(endtime)
    console.log($scope.datastreamIds)

    $scope.obsTop = 50

    $scope.dataLists = {}
    $scope.dataListsMeta = {}
    $scope.obsLinkStates = {}

    $scope.nextLinkObs = {}
    $scope.previousLinkObs = {}
    $scope.dataIsLoaded = {}
    $scope.onFirstPage = {}
    $scope.onLastPage = {}


    //initialize the states of the tables in $scope.obsLinkStates[dsid]
    $scope.datastreamIds.forEach(dsid => {
        let timespan = "resultTime ge " + starttime + " and " + "resultTime le " + endtime
        $scope.obsLinkStates[dsid] = getUrl() + "/v1.0/Datastreams('" + dsid + "')/Observations" + "?$filter=" + timespan + "&$expand=FeatureOfInterest&$top=" + $scope.obsTop.toString()
        $scope.onLastPage[dsid] = false
        $scope.onFirstPage[dsid] = true
    });

    //function that gets the headers
    $scope.getMetadata = function(){
        $scope.datastreamIds.forEach(dsid => {

            $http.get(getUrl() + "/v1.0/Datastreams('" + dsid + "')?$expand=Thing,ObservedProperty,Sensor").then(function (response) {
                $scope.dataListsMeta[dsid] = response.data
            });
        });
    };

    //function that gets the data for the table according to current state in $scope.obsLinkStates[dsid]
    $scope.refreshObsTable = function(){
        $scope.datastreamIds.forEach(dsid => {
    
            $http.get($scope.obsLinkStates[dsid]).then(function (response) {
                $scope.dataLists[dsid] = response.data.value
                $scope.dataIsLoaded[dsid] = true
                $scope.nextLinkObs[dsid] = response.data["@iot.nextLink"]
            });
        });
    };


    $scope.getMetadata()
    $scope.refreshObsTable()



    //pagination functions within the table, states are being tracked in $scope.obsLinkStates[dsid]
    $scope.nextLinksObservations = function(dsid){
        $scope.onFirstPage[dsid] = false

        $scope.dataLists[dsid] = undefined
        $scope.dataIsLoaded[dsid] = false
        $http.get(nextLinkObs[dsid]).then(function (response) {
            $scope.obsLinkStates[dsid] = nextLinkObs[dsid]
            $scope.dataLists[dsid] = response.data.value
            $scope.dataIsLoaded[dsid] = true
            if(response.data["@iot.nextLink"]){
                $scope.nextLinkObs[dsid] = response.data["@iot.nextLink"]
                $scope.onLastPage[dsid] = false
            } else {
                $scope.nextLinkObs[dsid] = undefined
                $scope.onLastPage[dsid] = true
            }
            
            //setting backlink: new next link obs is SET --> code from here is relativ to the new page
            let skip = parseInt($scope.nextLinkObs[dsid].split("$skip=")[1].split("&$")[0])
            let top = parseInt($scope.nextLinkObs[dsid].split("$top=")[1].split("&$")[0])

            if(skip-top>0){
                $scope.previousLinkObs[dsid] = $scope.nextLinkObs[dsid].split("$skip=")[0] + "$skip=" + (skip-top).toString() + $scope.nextLinkObs[dsid].split("$skip=")[1].splice(skip.length)
            } else {
                $scope.previousLinkObs[dsid] = $scope.nextLinkObs[dsid].split("$skip=")[0] + $scope.nextLinkObs[dsid].split("$skip=")[1].splice(skip.length)
            }
        });
    }

    $scope.previousLinksObservations = function(dsid){
        $scope.onLastPage[dsid] = false

        $scope.dataLists[dsid] = undefined
        $scope.dataIsLoaded[dsid] = false
        $http.get($scope.previousLinkObs[dsid]).then(function (response) {
            $scope.obsLinkStates[dsid] = $scope.previousLinkObs[dsid]
            $scope.dataLists[dsid] = response.data.value
            $scope.dataIsLoaded[dsid] = true
            $scope.nextLinkObs[dsid] = response.data["@iot.nextLink"]

            //relative to new page
            if($scope.previousLinkObs[dsid].contains("$skip")){
                let skip = parseInt($scope.previousLinkObs[dsid].split("$skip=")[1].split("&$")[0])
                let top = parseInt($scope.previousLinkObs[dsid].split("$top=")[1].split("&$")[0])
    
                if(skip-top>0){
                    $scope.previousLinkObs[dsid] = $scope.previousLinkObs[dsid].split("$skip=")[0] + "$skip=" + (skip-top).toString() + $scope.previousLinkObs[dsid].split("$skip=")[1].splice(skip.length)
                } else {
                    $scope.previousLinkObs[dsid] = $scope.previousLinkObs[dsid].split("$skip=")[0] + $scope.previousLinkObs[dsid].split("$skip=")[1].splice(skip.length)
                }

                $scope.onFirstPage[dsid] = false
            } else {
                $scope.previousLinkObs[dsid] = undefined
                $scope.onFirstPage[dsid] = true
            }
        });
    }

    if($scope.selectparams.obs.resultTime == undefined){$scope.selectparams.obs.resultTime = true};
    if($scope.selectparams.obs.result == undefined){$scope.selectparams.obs.result = true};
    //if($scope.selectparams.obs.phenomenonTime == undefined){$scope.selectparams.obs.phenomenonTime = true};
    




    $scope.notYetImplemented = function(){
        $.snackbar({content: "Functionality not yet implemented"})
    }

    //expand parameters...


    //HAUPTAUFGABE DES OBSERVATIONS CONTROLLER: PARAMETER AUS QUERY LESEN UND ENTSPRECHENDE URL ANFRAGEN



    //selects in /observations beziehen sich direkt darauf was in der csv heruntergeladen wird?


    
    /* //faas sollte hier "einfach" die ganze tabelle runterladen mit datastream name/id/...? (auswählbar?) als column header
    $scope.faasurl = "http://193.196.36.99:8080/function/thing-to-csv?thingid={{thingid}}&from_date={{from}}&to_date={{to}}&download={{thingid}}"

    $scope.faasquery = {}
    $scope.faasquery.thingid
    */



    //defaults
    /*
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="phenomenonTime desc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    */

    //filter all datastreams for datastreams ids, then expand observations and filter according to timespan --> read all parameter from url. nextlinks individuall given, metadata accessible
    //http://api.smartaq.net/v1.0/Datastreams?$filter=(@iot.id%20eq%20%27saqn:ds:a52d365%27)&$expand=Observations($filter=(resultTime%20ge%202020-01-30T13:27:52.738Z%20and%20resultTime%20le%202020-01-31T13:27:52.740Z);$top=5)



    //better: two steps, get all datastreams (faster)
    // http://api.smartaq.net/v1.0/Datastreams?$filter=(@iot.id%20eq%20%27saqn:ds:a52d365%27)
    // next step from each of those send a http request for observations like Datastreams('id...')/Observations and build tables from there. 
    //important: pagnination not in url but thats either impossible or awkward with several tables on one page

    

    /*
    var query=getUrl() + "/v1.0/Observations" + Object.keys($routeParams).filter(key => key.startsWith("$")).reduce(
        (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 
        */


    

    //$scope.loadTable(query,'obs');
    
    /*
    $scope.checkMyDs = {}

    $scope.checkAllDsOfThing = function(thingid){
        $scope.checkMyDs[thingid] = !$scope.checkMyDs[thingid]
        $scope.dataList.forEach(thing => {
            if(thing["@iot.id"] == thingid){
                thing["Datastreams"].forEach(datastream => {
                    $scope.selectedDatastreams[datastream["@iot.id"]] = $scope.checkMyDs[thingid]
                });
            };
        });
    };
    */




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
