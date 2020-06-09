gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);

    $scope.category = "Things" //variable used for in url and table loading and manipulation


    var defaulttop = 50;



    //pure table manipulation, select is NOT transported into the query
    if($scope.selectparams.Things.name == undefined){$scope.selectparams.Things.name = true};
    if($scope.selectparams.Things.Locations == undefined){$scope.selectparams.Things.Locations = true};
    if($scope.selectparams.Things.Datastreams == undefined){$scope.selectparams.Things.Datastreams = true};

    if($scope.selectparams.Datastreams.ObservedProperty == undefined){$scope.selectparams.Datastreams.ObservedProperty = true};
    if($scope.selectparams.Datastreams.phenomenonTime == undefined){$scope.selectparams.Datastreams.phenomenonTime = true};

    //expand stuff per default (expand IS necessarily transported into the query)
    $scope.expandparams.Things.Locations = true;
    $scope.expandparams.Things.HistoricalLocations = true;
    $scope.expandparams.Things.Datastreams = true;


    //default parameters that used in the query but hidden from the url 
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    // ---

    
    //build query for observations
    $scope.$watch('selectedDatastreams', function () {
        console.log("query parameter change detected")
        $scope.selectedDatastreamIds = Object.keys($scope.selectedDatastreams).filter(key => $scope.selectedDatastreams[key] == true)
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
    }, true);

    //for query filters: we use properties which at least 80% of entities have. This way it stays generic but useful at the same time

    
    function flattenDeep(arr1) {
        return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
    };

    $scope.prepareThingsPropertiesFilter = function(category){
        let thingspropcounts = {}
        let thingsproplist = flattenDeep($scope.dataList.map(th => Object.keys(th.properties)));
        
        [...new Set(thingsproplist)].forEach(
            thisproperty => $http.get(getUrl() + "/v1.0/" + category + "?$filter=properties/" + thisproperty + " ne 'somethingabsurd'&$top=1&$count=true").then(function(response){
                thingspropcounts[thisproperty] = response.data["@iot.count"]
                console.log(response.data["@iot.count"]/$scope.count)

                //fehler hier, füllt das array thingspropcounts nicht auf
            })
        );

        let listvalidproperties = Object.keys(thingspropcounts) //.filter(key => thingspropcounts[key]/$scope.count > 0.8);
        console.log(thingspropcounts)
        
    };

    /* //this has the problem that the query language allows more complex nesting with ";" between $parameters and deeper nesting with e.g. ()...;$expand=...($select=...))
    //the code here takes care of the form "test(buu,baaa,boo),shubada(shwami,shaa),..."
    $scope.keyIsExpandSelected = function(key, def=true){
        if ($routeParams['$expand']){
            $scope.expanddict = {}
            $routeParams['$expand'].split("),").map(x => x.replace(")","")).map(y => $scope.expanddict[y.split("(")[0]] = y.split("(")[1].split(","))
    }
    */

    //Implement Server Query Language in Static urls
    $scope.query=getUrl() + "/v1.0/" + $scope.category + Object.keys($routeParams).reduce((a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 
    
    
    $scope.loadTable = function(){

        //initiate loading animation
        $scope.dataIsLoaded[$scope.category] = false

        //transport expand parameters into the query
        let trueparamsexpand = Object.keys($scope.expandparams[$scope.category]).filter(key => $scope.expandparams[$scope.category][key] == true)

        //minimally subexpand stuff in Datastream
        if(trueparamsexpand.includes("Datastreams")){
            trueparamsexpand[trueparamsexpand.indexOf("Datastreams")] = "Datastreams($expand=Sensor,ObservedProperty)"
        }

        let paramUpdate = {}

        //if nothing changed possibly no need to reload the page

        if(trueparamsexpand.length>0){
            paramUpdate['$expand'] = trueparamsexpand.join()
        } else {
            paramUpdate['$expand'] = null
        }


        //default top if no top in route --> first page load
        if(!('$top' in $routeParams)){
            paramUpdate['$top'] = defaulttop; 
            $scope.newTop = defaulttop;
        } else {
            //mirror routing value
            $scope.newTop = $routeParams['$top']
        };



        if(!("$skip" in $routeParams)){
            paramUpdate['$skip'] = 0;
        };

        $route.updateParams(paramUpdate);


        $http.get($scope.query).then(function (response) {

            $scope.dataIsLoaded[$scope.category] = true
            
            $scope.dataList = response.data.value;

            //pagination ---
            if($routeParams['$skip']){
                $scope.thisLinkSkip = $routeParams['$skip']
            } else {
                $scope.thisLinkSkip = 0
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
    
    //filter for properties
    //https://api.smartaq.net/v1.0/Datastreams?$filter=properties/operator_url%20eq%20%27lfu.bayern.de%27&$select=@iot.id
    //https://api.smartaq.net/v1.0/Things?$filter=Datastreams/Sensor/properties/manufacturer.domain%20eq%20%27grimm-aerosol.com%27

    $scope.applyQueryFilter = function(){
        $route.updateParams({'$filter':$scope.queryFilter});
    }

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


    $scope.goToPage = function(topage){
        let skip = (topage-1)*$scope.newTop

        //page 1 skip = 0
        //page 2 skip = top
        //page 3 skip = 2xtop
        //...

        $route.updateParams({'$skip': skip})
    };

    $scope.objToArray = function(obj){
        var ret = []
        Object.keys(obj).forEach(key => {
            ret.push(key + ": " + obj[key])
        })
        return ret
    }

    
    $scope.loadTable();
    


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
    
    $scope.downloadInProgress = function(){
        $.snackbar({content: "Downloading Data. Please Wait. This may take up to a Minute.", timeout: 10000})
    }

});