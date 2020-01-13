gostApp.directive('exportbtn', function() {
    return {
        restrict: 'E',
        scope: {
            thingid: '=thingid'
        },
        link: function($scope){
            $scope.to = window.moment().toISOString();
            $scope.from = window.moment().subtract(24, 'hours').toISOString();
        },
        templateUrl: window.dashboardSettings.root + 'views/exportbutton.html'
    };
});