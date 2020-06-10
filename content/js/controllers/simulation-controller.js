gostApp.controller('SimulationCtrl', function ($scope, $http, $routeParams, Page) {

    $scope.Page.setHeaderIcon(iconThing);

    $scope.mapVisible = true;
    $scope.showMap = true;
    $scope.noMapControls = true;
    $scope.simulationControl = true;
    $scope.showGraph = false

    var polygonPoints;


    $scope.$on('drawnPolygonPoints4', function(event, data) {
        polygonPoints = data
    });

    $scope.taboptions1clicked = function () {

    };
    


    $scope.taboptions2clicked = function () {
        

    };

    $scope.startSimulation = function(){
        console.log("Start Simulation. Selected Area GPS (corners):")
        console.log(polygonPoints)
        console.log("center: ")
        let center = [(polygonPoints[0][0] + polygonPoints[1][0])/2, (polygonPoints[1][1] + polygonPoints[2][1])/2]
        console.log(center)
    }

    
    //Collapsibles 
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            } 
        });
    };

});
