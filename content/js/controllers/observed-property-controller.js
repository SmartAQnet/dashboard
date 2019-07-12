gostApp.controller('ObservedPropertyCtrl', function ($scope, $http, $routeParams, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('OBSERVED PROPERTY(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);

    $http.get(getUrl() + "/v1.0/ObservedProperties(" + getId($scope.id) + ")").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.definition = response.data["definition"];
        $scope.conventions = response.data["properties"]["conventions"];
        $scope.Page.selectedThing = response.data;
    });


    $scope.mapVisible = true;

    $scope.tabPropertiesClicked = function () {

        //$scope.mapVisible = true;

        $http.get(getUrl() + "/v1.0/ObservedProperties(" + getId($scope.id) + ")/Datastreams?$expand=Observations($top=1;$orderby=phenomenonTime%20desc),Observations/FeatureOfInterest").then(function (response) {
            $scope.allObsProps = response.data.value
            angular.forEach($scope.observedproperties, function (value, key) {
                $scope.thisResultValue = response.data.value["Observation"]["result"];
                $scope.thisFoI = response.data.value["Observation"]["FeatureOfInterest"]["feature"];
                
                addGeoJSONcolorFeature($scope.thisFoI,$scope.thisResultValue);
            });
            
        });

    };
    


    $scope.tabDatastreamsClicked = function () {
        
        //$scope.mapVisible = false;

        $http.get(getUrl() + "/v1.0/ObservedProperties(" + getId($scope.id) + ")/Datastreams").then(function (response) {
    
            $scope.datastreamsList = response.data.value;
        });
    };

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

    $scope.datastreamClicked = function (datastreamID) {
        angular.forEach($scope.observedproperties, function (value, key) {
            $scope.Page.selectedDatastream = value;
        });
        $scope.Page.go("datastream/" + datastreamID);
    };

//   $scope.sortBy = function(propertyName) {
//     $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
//     $scope.propertyName = propertyName;
//   };
});
