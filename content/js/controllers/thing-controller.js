gostApp.controller('ThingCtrl', function ($scope, $http, $routeParams, $location, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('THING(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconThing);


    //pagination example for ng-repeat tables
    //http://jsfiddle.net/2ZzZB/56/

    //also add and remove columns by defining all of them, then display none for those not listed in the route params. does not work for those that dont need expanding
    // better: add all of them and let user enable with checkboxes and if necessary then add the route params?

    //tabs of the entity (properties, location, ...) should then follow the scheme by taking the same query and add like things(saqn:t:...)/historicallocations
    // --> thing/saqn:t:.../historicallocations ?
    // also, why distinguish things and thing here? frost server doesnt. treat as new page things/saqn:t:... 

    //remove query params
    $location.search({})

    $scope.patchThing = {}
    $scope.patchLocation = {}

    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")?$expand=Locations").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.properties = response.data["properties"];
        $scope.Page.selectedThing = response.data;
        $scope.location = response.data["Locations"][0]["location"]["coordinates"];
        $scope.showMap = true;


        // let patchjson = {
        //     'name': $scope.patchThing.name, 
        //     'description': $scope.patchThing.description, 
        //     'properties': {
        //         'hardware.id': $scope.patchThing.description['hardware.id'],
        //         'shortname': $scope.patchThing.description['shortname'],
        //         'operator.domain': $scope.patchThing.description['operator.domain']
        //     }
        // };

        $scope.patchThing.name = $scope.name;
        $scope.patchThing.description = $scope.description;
        $scope.patchThing.properties = $scope.properties;
        $scope.patchThing.id = $scope.id;
        $scope.patchtarget = $scope.Page.selectedThing["@iot.selfLink"]
        $scope.patchpw = ''
        $scope.pwvalid = ''
    });
    $scope.mapVisible = true;
    

    $scope.deletekey = function(key,obj){
        delete obj[key]
    }

    $scope.tabPropertiesClicked = function () {
    };

    $scope.tabLocationsClicked = function () {
    };

    //display current thing location in another color --> change color of the respective pin

    //not working atm, cant find the functions which are defined in the map controller... maybe add this function to the map controller where the view is centered and check the current scope
    $http.get(getUrl() + "/v1.0/Things(" + getId($scope.id) + ")/Locations").then(function (response) {
        $scope.locationsList = response.data.value;

        $scope.patchLocation.name = $scope.locationsList[0]["name"]
        $scope.patchLocation.description = $scope.locationsList[0]["description"]
        $scope.patchLocation.coordinates = $scope.locationsList[0]["location"]["coordinates"]

        //highlightCurrentFeature($scope.locationsList[0]["location"]["coordinates"])         
        //setview($scope.locationsList[0]["location"]["coordinates"]);
    });
    

    $scope.patchEntity = function(){
        if(document.getElementById('patchpwcontainer').value == 'smartaqnet'){
            $scope.pwvalid = "PASSWORD CORRECT";
            document.getElementById('patchpwcontainer').classList.add("text-success");
            document.getElementById('patchpwcontainer').classList.remove("text-danger");
            console.log(JSON.stringify($scope.patchThing))
            //$http.patch("https://smartaqnet-dev.dmz.teco.edu/v1.0/Things('saqn%3At%3Acf02643')",$scope.patchThing).then(function (response) {});
            } else {
            $scope.pwvalid = "PASSWORD INCORRECT";
            document.getElementById('patchpwcontainer').classList.add("text-danger");
            document.getElementById('patchpwcontainer').classList.remove("text-success");
        }
    }


    $scope.tabHistoricalLocationsClicked = function () {

        $http.get(getUrl() + "/v1.0/Things(" + getId($scope.Page.selectedThing["@iot.id"]) + ")/HistoricalLocations?$expand=Locations").then(function (response) {
            $scope.historicalLocationsList = response.data.value;
        });
    };

    $scope.tabDatastreamsClicked = function () {
        $http.get(getUrl() + "/v1.0/Things(" + getId($scope.Page.selectedThing["@iot.id"]) + ")/Datastreams?$expand=ObservedProperty").then(function (response) {
            $scope.datastreamsList = response.data.value;
        });
    };

    $scope.datastreamClicked = function (datastreamID) {
        angular.forEach($scope.things, function (value, key) {
            if (value["@iot.id"] == thingID) {
                $scope.Page.selectedDatastream = value;
            }
        });

        $scope.Page.go("datastream/" + datastreamID);
    };

  $scope.sortBy = function(propertyName) {
    $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
    $scope.propertyName = propertyName;
  };
});
