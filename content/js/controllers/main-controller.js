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


    //Browser check from https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser

    $scope.browserCheck = function(){
        // Opera 8.0+
        var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

        // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';

        // Safari 3.0+ "[object HTMLElementConstructor]" 
        var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

        // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;

        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;

        // Chrome 1 - 79
        var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

        // Edge (based on chromium) detection
        var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

        // Blink engine detection
        var isBlink = (isChrome || isOpera) && !!window.CSS;


        if(isIE){
            alert("You are using an outdated Browser. Parts of the Website may not function properly.")
        }

    };
    $scope.browserCheck();
});