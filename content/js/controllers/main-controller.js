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

    //initialize bootstrap tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })

    /** Functions that enforce FROST query language on dashboard tables */

    $scope.timeframe = {}
    
    //triggering ng-ifs for display
    $scope.dataIsLoaded = {}
    $scope.dataIsLoaded.things = undefined
    $scope.dataIsLoaded.obs = undefined


    $scope.selectedDatastreams = {}
    $scope.selectedDatastreamIds = []
    $scope.selectedTimeframe = {}  

    //select for table manipulation. NOT transported into query
    $scope.selectparams = {}
    $scope.selectparams.obs = {}
    $scope.selectparams.things = {}

    //expand parameters. ARE transported into the query
    $scope.expandparams = {}
    $scope.expandparams.obs = {}
    $scope.expandparams.things = {}


    

    //function for "update table" button that pushes the user input into the url to trigger the query
    $scope.updatequery = function(category){

        //transport expand parameters into the query
        let trueparamsexpand = Object.keys($scope.expandparams[category]).filter(key => $scope.expandparams[category][key] == true)

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

    $scope.linkClicked = function (type, id) {
        /*
        angular.forEach($scope.things, function (value, key) {
            if (value["@iot.id"] == id) {
                $scope.Page.selectedThing = value;
            }
        });
        */
        $scope.Page.go(type + "/" + id);
    };



});