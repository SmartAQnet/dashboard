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
    
    //function for "update table" button that pushes the user input into the url to trigger the query
    $scope.updatequery = function(){
        let trueparamsselect = []
        Object.keys($scope.selectparams).forEach(key => {
            if($scope.selectparams[key]==true){
                trueparamsselect.push(key)
            } 
        });

        let trueparamsexpand = []
        Object.keys($scope.expandparams).forEach(key => {
            if($scope.expandparams[key]==true){
                trueparamsexpand.push(key)
            } 
        });

        let paramUpdate = {}

        paramUpdate['$top'] = $scope.newTop

        if(trueparamsselect.length>0){
            paramUpdate['$select'] = trueparamsselect.join()
        } else {
            trueparamsselect=null
        }

        if(trueparamsexpand.length>0){
            paramUpdate['$expand'] = trueparamsexpand.join()
        } else {
            trueparamsexpand=null
        }

        $route.updateParams(paramUpdate);
    };
    // ---




    $scope.loadTable = function(url){

        if(!("$top" in $routeParams)){
            $scope.newTop = 50;
            $route.updateParams({'$top':$scope.newTop});
        } else {$scope.newTop = $routeParams["$top"]}

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

            $scope.maxpages = Math.ceil(response.data["@iot.count"]/$scope.newTop)
            if($scope.nextLinkSkip > 0){
                $scope.currentpage = Math.ceil($scope.nextLinkSkip/$scope.newTop)
            } else {
                $scope.currentpage = $scope.maxpages
            }
        });
    };
    
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


});