gostApp.controller('PatchCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('PATCHING');
    $scope.Page.setHeaderIcon(iconObservedProperty);

    if(! "$orderby" in $routeParams) $routeParams["$orderby"]="name asc";

    var query=getUrl() + "/v1.0/ObservedProperties"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    $http.get(query).then(function (response) {
        $scope.dataliste = response.data.value;
    });


    // $scope.addNewThing = function(newThing) {
    //     var res = $http.post(getUrl() + '/v1.0/Things', newThing);
    //     res.success(function(data, status, headers, config) {
    //         alert( "added: " + JSON.stringify({data: data}));
    //     });
    //     res.error(function(data, status, headers, config) {
    //         alert( "failure: " + JSON.stringify({data: data}));
    //     });
    // };

     $scope.patchEntity = function (entity) {
        var res = $http.patch(getUrl() + '/v1.0/' +  + '(' + getId(entity["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.observedpropertiesList.indexOf(entity);
            $scope.observedpropertiesList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
     };
});
