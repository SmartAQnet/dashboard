gostApp.controller('MainCtrl', function ($scope, $location, $http, Page, $routeParams, $route) {
    $http.defaults.headers.post["Content-Type"] = "application/json";
    $http.defaults.headers.post["Accept"] = "application/json";

    $scope.Page = Page;
    $scope.$route = $route;
    $scope.$location = $location;

    $scope.Page.setHeaderIcon = function (icon) {
        $scope.headerIcon = 'fa ' + icon;
    };

    $scope.Page.go = function (path) {
        $location.path(path);
    };


    /** Functions that enforce FROST query language on dashboard tables */

    
    //triggering ng-ifs for display
    $scope.dataIsLoaded = false


    $scope.selectparams = {}
    $scope.expandparams = {}

    $scope.selectparams.obs = {}
    $scope.expandparams.obs = {}

    $scope.selectparams.things = {}
    $scope.expandparams.things = {}

    //function for "update table" button that pushes the user input into the url to trigger the query
    $scope.updatequery = function(){

        let trueparamsexpand = []
        Object.keys($scope.expandparams).forEach(category => {
            category.forEach(key => {
                if($scope.expandparams[category][key]==true){
                    trueparamsexpand.push(key)
                } 
            });
        });

        let trueparamsselect = []
        Object.keys($scope.selectparams).forEach(category => {
            category.forEach(key => {
                if($scope.selectparams[category][key]==true){
                    trueparamsselect.push(key)
                } 
            });
        });

        let trueparamsfilter = []
        Object.keys($scope.filterparams).forEach(category => {
            category.forEach(key => {
                if($scope.filterparams[category][key]==true){
                    trueparamsfilter.push(key)
                } 
            });
        });


        let paramUpdate = {}

        paramUpdate['$top'] = $scope.newTop


        if(trueparamsexpand.length>0){
            paramUpdate['$expand'] = trueparamsexpand.join()
        } else {
            paramUpdate['$expand'] = null
        }

        //needs to be more specific, there are some that need to be concatenated with or and some with and
        if(trueparamsfilter.length>0){
            paramUpdate['$filter'] = trueparamsfilter.join(' or ')
        } else {
            paramUpdate['$filter'] = null
        }

        $route.updateParams(paramUpdate);
    };
    // ---




    $scope.loadTable = function(url){

        if(!("$top" in $routeParams)){
            $scope.newTop = 50;
            $route.updateParams({'$top':$scope.newTop});
        } else {$scope.newTop = $routeParams["$top"]}

        $scope.updatequery()

        $http.get(url).then(function (response) {

            $scope.dataIsLoaded = true
            
            $scope.dataList = response.data.value;
            
            if($routeParams['$top']){
                $scope.newTop = $routeParams['$top']
            };

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
        });
    };
    /* //function that was used to bind checkbox to select parameter in query
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
    };*/

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

    $scope.linkClicked = function (type, id) {
        angular.forEach($scope.things, function (value, key) {
            if (value["@iot.id"] == id) {
                //$scope.Page.selectedThing = value;
            }
        });

        $scope.Page.go(type + "/" + id);
    };

    /** up to here. */


});