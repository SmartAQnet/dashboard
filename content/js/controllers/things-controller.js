gostApp.controller('ThingsCtrl', function ($scope, $http, $routeParams, $route, $rootScope) {
    $scope.Page.setTitle('THINGS');
    $scope.Page.setHeaderIcon(iconThing);

    //toggle map displays
    $scope.noMapControls = true
    $scope.showMap = true
    $scope.mapVisible = true;

    var mapIsReady

    $scope.$on("mapIsReady", function(){
        mapIsReady = true
    })

    $scope.filteredlist = []


    $scope.category = "Things" //variable used for in url and table loading and manipulation
    $scope.entitycount = {} //used to hold counts for things, sensors, ...
    $scope.entityfilter = {} //used to hold valid filter names for view
    $scope.entityfiltervalues = {} //used to toggle filters on and off

    $scope.entityfiltervalues.Things = {}
    $scope.entityfiltervalues.Sensors = {}
    $scope.entityfiltervalues.ObservedProperties = {}

    var defaulttop = 200;


    //expand stuff per default (expand IS necessarily transported into the query)
    $scope.expandparams.Things.Locations = true;
    $scope.expandparams.Things.HistoricalLocations = true;
    $scope.expandparams.Things.Datastreams = true;


    $scope.filterpropertieson = {}
    $scope.filterpropertieson.Things = false
    $scope.filterpropertieson.Sensors = false
    $scope.filterpropertieson.ObservedProperties = false
    $scope.filterpropertiesdisabled = true

    $scope.filterproperties = function(item){

        //filter off --> nothing is filtered, valid = true by default
        let validByThing = !$scope.filterpropertieson.Things
        let validBySensor = !$scope.filterpropertieson.Sensors
        let validByObsProp = !$scope.filterpropertieson.ObservedProperties

        if(item.properties && $scope.filterpropertieson.Things){
            Object.keys(item.properties).forEach(function(el){ //el is the property key, e.g. "shortname"
                if(item.properties[el] && el in $scope.entityfiltervalues['Things'] && $scope.entityfiltervalues['Things'][el][item.properties[el]]){
                    validByThing=true
                }
            })
        };

        if(item.Datastreams && $scope.filterpropertieson.Sensors){
            item.Datastreams.forEach(function(ds){
                if(ds.Sensor.properties){
                    Object.keys(ds.Sensor.properties).forEach(function(el){ //el is the property key, e.g. "shortname"
                        if(ds.Sensor.properties[el] && el in $scope.entityfiltervalues['Sensors'] && $scope.entityfiltervalues['Sensors'][el][ds.Sensor.properties[el]]){
                            validBySensor=true
                        }
                    })
                };
            })
        };

        if(item.Datastreams && $scope.filterpropertieson.ObservedProperties){
            item.Datastreams.forEach(function(ds){
                if(ds.ObservedProperty.name && $scope.entityfiltervalues['ObservedProperties']["name"][ds.ObservedProperty.name]){
                    validByObsProp=true
                }
            })
        };

        return validByThing && validBySensor && validByObsProp
    };

    //default parameters that used in the query but hidden from the url 
    if(!("$orderby" in $routeParams)) $routeParams["$orderby"]="name asc";
    if(!("$count" in $routeParams)) $routeParams["$count"]="true";
    // ---

    /*
    //build query for observations
    $scope.$watch('selectedDatastreams', function () {
        console.log("query parameter change detected")
        $scope.selectedDatastreamIds = Object.keys($scope.selectedDatastreams).filter(key => $scope.selectedDatastreams[key] == true)
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
    }, true);
    */




    //for query filters: we use properties which at least 80% of entities have. This way it stays generic but useful at the same time

    
    function flattenDeep(arr1) {
        return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
    };


    $scope.prepareObsPropFilter=function(){

        if($scope.filterpropertieson["ObservedProperties"]){
            $scope.filterpropertieson["ObservedProperties"]=false
        } else {

            $http.get(getUrl() + "/v1.0/ObservedProperties?$select=name&$count=true&$top=1000").then(function(response){
                var thelist = response.data.value
                var thecount = response.data["@iot.count"]

                if(response.data["@iot.nextLink"]){
                    alert("Too many entities. Next Link present, filter may not be set up accurately")
                };


                listvalidproperties = ["name"]
                $scope.entityfilter.ObservedProperties = listvalidproperties

                listvalidproperties.forEach(function(el){
                    $scope.entityfiltervalues.ObservedProperties[el] = thelist.reduce(function(acc,item){acc[item[el]]=false; return acc},{})
                });

            });
        };
    };

    $scope.prepareThingsPropertiesFilter = function(cat){

        if($scope.filterpropertieson[cat]){
            $scope.filterpropertieson[cat]=false
        } else {

            let threshold = 0.8

            $http.get(getUrl() + "/v1.0/" + cat + "?$select=properties&$count=true&$top=1000").then(function(response){
                var thelist = response.data.value
                var thecount = response.data["@iot.count"]

                if(response.data["@iot.nextLink"]){
                    alert("Too many entities. Next Link present, filter may not be set up accurately")
                };
            
                //list of all property keys
                let proplist = flattenDeep(
                    thelist.reduce(function(acc, th){
                        th.properties ? acc = acc.concat(Object.keys(th.properties)) : acc = acc
                        return acc
                    },[])
                );

                //json of all property keys and their number of occurrence of the form {key1 : count1, key2 : count2, ...}
                var propcounts = proplist.reduce(function (acc, item) {
                    acc[item] ? acc[item]++ : acc[item] = 1
                    return acc
                }, {});

                //list of properties which occur in more than xx% of things (threshold)
                let listvalidproperties = Object.keys(propcounts).filter(key => propcounts[key]/thecount > threshold);

                $scope.entityfilter[cat] = listvalidproperties

                /**
                 * fills $scope.entityfiltervalues[cat] with a json with boolean values for each valid keys values
                 * e.g. : {key A: {val1 : false, val2 : false, val3 : false}, keyB: {...}, ...}
                 * these boolean values are accessed by checkboxes in the view and then read out
                 * to define the query filter for properties
                 */
                
                listvalidproperties.forEach(function(el){
                    $scope.entityfiltervalues[cat][el] = thelist.reduce(function(acc,item){
                        item.properties && item.properties[el] ? acc[item.properties[el]]=false : acc=acc
                        return acc
                    },{})
                });

            }); 
        };
    };

    var thingtimesready;
    $scope.thingtimes = {}

    //fills the scope variable $scope.thingtimes for each thing with true/false whether it has any data in the given interval
    var checkThingsTimes = function(thingslist,interval){
        var intstart
        var intend
        [intstart, intend] = interval.split("/")
        if(thingslist.length>0){
            thingslist.forEach(function(thisthing){
                var thingstart;
                var thingend;
                if(thisthing["Datastreams"].length>0){
                    thisthing["Datastreams"].forEach(function(ds){
                        if(ds["phenomenonTime"]){
                            var start;
                            var end;
                            [start, end] = ds["phenomenonTime"].split("/")

                            if(!thingstart){
                                thingstart = start
                            } else if(moment(start) < moment(thingstart)){
                                thingstart = start
                            }

                            if(!thingend){
                                thingend = end
                            } else if(moment(end) > moment(thingend)){
                                thingend = end
                            }
                        }
                    });
                    if((moment(intstart) > moment(thingend)) | (moment(thingstart) > moment(intend))){
                        $scope.thingtimes[thisthing["@iot.id"]] = false
                    } else {
                        $scope.thingtimes[thisthing["@iot.id"]] = true
                    }
                }
            })
        }
    }


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

        //minimally subexpand stuff in HistLocs
        if(trueparamsexpand.includes("HistoricalLocations")){
            trueparamsexpand[trueparamsexpand.indexOf("HistoricalLocations")] = "HistoricalLocations($expand=Locations)"
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

            thingtimesready = true
            checkThingsTimes($scope.dataList,$scope.timeframe.fromISO + "/" + $scope.timeframe.toISO)



        

            //generate select checkboxes or table manipulation
            //dictionary that holds the selectable keys for each category
            var selectKeys = {}
            $scope.selectparams = {}

            //main category first, here this is 'Things'
            selectKeys[$scope.category] = $scope.dataList.reduce(function(acc, item){
                Object.keys(item).forEach(i => acc.push(i))
                return [...new Set(acc)].filter(item => !item.includes("@iot.navigationLink"))
            }, []);


            //now repeat process for subcategories
            selectKeys[$scope.category].forEach(function(key){
                selectKeys[key] = $scope.dataList.map(el => el[key]).reduce(function(acc, item){
                    if(Array.isArray(item)){
                        var itemkeys = item.reduce(function(subacc, subitem){
                            Object.keys(subitem).forEach(i => subacc.push(i))
                            return [...new Set(subacc)].filter(subitem => !subitem.includes("@iot.navigationLink"))
                        }, []);
                        itemkeys.forEach(i => acc.push(i))
                    } else if(typeof item === 'object' && item !== null){
                        Object.keys(item).forEach(i => acc.push(i))
                    }

                    return [...new Set(acc)].filter(item => !item.includes("@iot.navigationLink"))
                }, []);
            });

            
            //populate the scope variable that maps the checkboxes in the view
            Object.keys(selectKeys).forEach(function(key){
                if(selectKeys[key].length > 0){
                    $scope.selectparams[key] = {}
                    selectKeys[key].forEach(function(subkey){

                            $scope.selectparams[key][subkey] = undefined
                        
                    });
                }
            });
            
            // console.log(selectKeys)
            // console.log($scope.selectparams)


            //manual adjustment
            $scope.selectparams.properties = {}

            if($scope.selectparams.Things.name == undefined){$scope.selectparams.Things.name = true};
            if($scope.selectparams.Things.Locations == undefined){$scope.selectparams.Things.Locations = true};
            if($scope.selectparams.Things.Datastreams == undefined){$scope.selectparams.Things.Datastreams = true};

            if($scope.selectparams.Datastreams.ObservedProperty == undefined){$scope.selectparams.Datastreams.ObservedProperty = true};
            if($scope.selectparams.Datastreams.phenomenonTime == undefined){$scope.selectparams.Datastreams.phenomenonTime = true};

            if($scope.selectparams.Locations.name == undefined){$scope.selectparams.Locations.name = true};


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

            $scope.entitycount[$scope.category] = response.data["@iot.count"]
            $scope.count = response.data["@iot.count"] //shorthand for accessibility

            $scope.maxpages = Math.ceil($scope.count/$scope.newTop)
            if($scope.nextLinkSkip > 0){
                $scope.currentpage = Math.ceil($scope.nextLinkSkip/$scope.newTop)
            } else {
                $scope.currentpage = $scope.maxpages
            }
            //pagination end ---

            //populate the map with all things
            //if the map is already ready set up watch service
            if(mapIsReady){
                console.log("Requesting to add Things to Map")
                $rootScope.$broadcast("addToMap",$scope.dataList)
            };

            //watch for angular filter on the list and gray out all things that are filtered out
            $scope.$watch('filteredlist.length', function(newVal,oldVal){

                //color everything default
                $scope.dataList.forEach(function(el){
                    $rootScope.$broadcast('changeFeatureStyle',{"@iot.id": el["@iot.id"], "style": "default"})
                });

                //color the difference of the lists gray
                $scope.dataList.filter(el => !$scope.filteredlist.includes(el)).forEach(function(el){
                    $rootScope.$broadcast('changeFeatureStyle',{"@iot.id": el["@iot.id"], "style": "gray"})
                });

            });

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

        if(thingtimesready){
            checkThingsTimes($scope.dataList,$scope.timeframe.fromISO + "/" + $scope.timeframe.toISO)
        }

        /*
        //for displaying the query
        $scope.selectedTimeframe = "(resultTime ge " + $scope.timeframe.fromISO + " and resultTime le " + $scope.timeframe.toISO + ")"
        $scope.observationsQuery = "?$filter=" + $scope.selectedTimeframe + " and " + "(" + $scope.selectedDatastreamIds.map(id => "Datastream/@iot.id eq '" + id + "'").join(' or ') + ")"
        */
    }

    pushDateToQuery(moment().subtract(24, 'hour'),window.moment())
    
    $scope.downloadInProgress = function(){
        $.snackbar({content: "Downloading Data. Please Wait. This may take up to a Minute.", timeout: 10000})
    }

});