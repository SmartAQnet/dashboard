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
    $scope.selectparams.datastreams = {}
    $scope.selectparams.things = {}

    //expand parameters. ARE transported into the query
    $scope.expandparams = {}
    $scope.expandparams.obs = {}
    $scope.expandparams.things = {}

    
    



    $scope.linkClicked = function (type, id) {

        //$location.url($location.path());
        $location.search({});
        $scope.Page.go(type + "/" + id);
    };



});