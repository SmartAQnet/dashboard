gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);


    //pure table manipulation, select is NOT transported into the query
    if($scope.selectparams.things.name == undefined){$scope.selectparams.things.name = true};
    if($scope.selectparams.things.Locations == undefined){$scope.selectparams.things.Locations = true};
    if($scope.selectparams.things.Datastreams == undefined){$scope.selectparams.things.Datastreams = true};

    if($scope.selectparams.datastreams.name == undefined){$scope.selectparams.datastreams.name = true};
    if($scope.selectparams.datastreams.phenomenonTime == undefined){$scope.selectparams.datastreams.phenomenonTime = true};

    //expand stuff per default (expand IS necessarily transported into the query)
    $scope.expandparams.things.Locations = true;
    $scope.expandparams.things.HistoricalLocations = true;
    $scope.expandparams.things.Datastreams = true;


    //default parameters that used in the query but hidden from the url 
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    // ---

    
    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Things" + Object.keys($routeParams).reduce((a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    //build query for observations
    $scope.$watch('selectedDatastreams', function () {
        console.log("query parameter change detected")
        $scope.selectedDatastreamIds = Object.keys($scope.selectedDatastreams).filter(key => $scope.selectedDatastreams[key] == true)
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
    }, true);


    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */

        //function for "update table" button that pushes the user input into the url to trigger the query
        $scope.updatequery = function(category){

            //transport expand parameters into the query
            let trueparamsexpand = Object.keys($scope.expandparams[category]).filter(key => $scope.expandparams[category][key] == true)
    
            //minimally subexpand stuff in Datastream
            if(trueparamsexpand.includes("Datastreams"))[
                trueparamsexpand[trueparamsexpand.indexOf("Datastreams")] = "Datastreams($expand=Sensor,ObservedProperty)"
            ]
    
    
            let paramUpdate = {}
    
            paramUpdate['$top'] = $scope.newTop
    
    
            if(trueparamsexpand.length>0){
                paramUpdate['$expand'] = trueparamsexpand.join()
            } else {
                paramUpdate['$expand'] = null
            }
    
    
            $route.updateParams(paramUpdate);
        };
        // ---
    
    
    
    
        $scope.loadTable = function(url,category){
    
            $scope.dataIsLoaded[category] = false
    
            if(!("$top" in $routeParams)){
                $scope.newTop = 50;
                $route.updateParams({'$top':$scope.newTop});
            } else {$scope.newTop = $routeParams["$top"]}
    
            $scope.updatequery(category)
    
            $http.get(url).then(function (response) {
    
                $scope.dataIsLoaded[category] = true
                
                $scope.dataList = response.data.value;
                
                /*
                if($routeParams['$top']){
                    $scope.newTop = $routeParams['$top']
                };
                */
    
                //pagination ---
                if($routeParams['$skip']){
                    $scope.thisLinkSkip = $routeParams['$skip']
                };
    
                if(response.data["@iot.nextLink"]){
                    $scope.nextLinkSkip = (response.data['@iot.nextLink']).match(/(?:skip=)([0-9]+)/)[1]
                } else {
                    $scope.nextLinkSkip = 0
                };
    
                $scope.count = response.data["@iot.count"]
                $scope.maxpages = Math.ceil($scope.count/$scope.newTop)
                if($scope.nextLinkSkip > 0){
                    $scope.currentpage = Math.ceil($scope.nextLinkSkip/$scope.newTop)
                } else {
                    $scope.currentpage = $scope.maxpages
                }
                //pagination end ---
            });
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

    $scope.objToArray = function(obj){
        var ret = []
        Object.keys(obj).forEach(key => {
            ret.push(key + ": " + obj[key])
        })
        return ret
    }

    
    $scope.loadTable(query,'things');
    


    $(function() {
        $('#calendar').daterangepicker({
            timePicker: true,
            timePicker24Hour: true,
            startDate: moment().subtract(24, 'hour'),
            endDate: moment(),
            drops: "up",
                    ranges: {
                        'Last Hour': [moment().subtract(1, 'hours'), moment()],
                        'Last 3 Hours': [moment().subtract(3, 'hours'), moment()],
                        'Last 6 Hours': [moment().subtract(6, 'hours'), moment()],
                        'Last 12 Hours': [moment().subtract(12, 'hours'), moment()],
                        'Last 24 Hours': [moment().subtract(24, 'hours'), moment()],
                        'Last 3 Days': [moment().subtract(3, 'days'), moment()]
                    },
            locale: {
                format: 'YYYY-MM-DD HH:mm:ss'
            }
        },pushDateToQuery);
    });
    

    
    
    function pushDateToQuery(start, end){
        //for watch service
        $scope.timeframe.from = start
        $scope.timeframe.to = end

        //parameter for the download functonality
        $scope.timeframe.fromISO = start.toISOString()
        $scope.timeframe.toISO = end.toISOString()

        //for displaying the query
        $scope.selectedTimeframe = "(resultTime ge " + $scope.timeframe.fromISO + " and resultTime le " + $scope.timeframe.toISO + ")"
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"

    }

    pushDateToQuery(moment().subtract(24, 'hour'),window.moment())
    

});