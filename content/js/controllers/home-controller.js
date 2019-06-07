gostApp.controller('HomeCtrl', function ($scope, $http) {
	$scope.Page.setTitle('smartAQnet');
	$scope.Page.setHeaderIcon('');

	$http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastreams/phenomenonTime%20lt%20now()%20sub%20duration%27P1d%27&$count=true&$top=0").then(function (response) {
		$scope.active_devices = response.data["@iot.count"];
	});

	var interval=60000;
	var lasttime=null;
	var lastcount;
	var count=0;

	$scope.setObservations=function(){
		if(count==0)
		{
			$http.get(getUrl() + "/v1.0/Observations?$top=0&$count=true").then(function (response) {
				var newcount=response.data["@iot.count"];
				var newtime=moment(); //TODO use server date (not possible due to cors policy)
				if(lasttime !== null && newcount!=lastcount) 
			        {
					interval=moment.duration(newtime.diff(lasttime)).asMilliseconds()/(newcount-lastcount) + ($scope.n_observations - newcount)/20000; 
					count=Math.floor(20000/interval);
				}
				else
				{
					$scope.n_observations=newcount;
				}
				lasttime=newtime;
				lastcount=newcount;
				window.setTimeout($scope.setObservations, interval);
			});
		}
		else
		{	
			$scope.n_observations++;
			count--; 
			if(interval>0) window.setTimeout($scope.setObservations, interval);
		}
		$scope.$apply()
	}

	window.setTimeout($scope.setObservations, 0);

	$scope.$on('$destroy',function(){
		interval=0;
	});

	$scope.mapVisible = true;
	createMap();


	//show location of all active things
	$http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastream/PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27&$expand=Locations&$top=9999999").then(function (response) {
		$scope.alllocationsList = response.data.value;
		angular.forEach($scope.alllocationsList, function (value, key) {
			addGeoJSONFeature(value["Locations"][0]["location"]);
			//addHeatmapFeature(value["Locations"][0]["location"],Math.random()*1000);
		});

		//zoomToGeoJSONLayerExtent(); leave default here because otherwise it would just show the entire world
	});
	

	/*
	//get pm10 datastreams, recent observation value for color and feature of interest for location
	$http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27saqn:op:mcpm10%27&$expand=Observations($top=1;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
		$scope.alldatastreams = response.data.value;
		angular.forEach($scope.alldatastreams, function (value, key) {
			$scope.obsresult = value["Observations"][0]["result"];
			$scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
			addGeoJSONcolorFeature($scope.obsFOI,$scope.obsresult);
		});

		//zoomToGeoJSONLayerExtent(); leave default here because otherwise it would just show the entire world
	});
	*/


	var pincheckbox = document.getElementById("Layer-Pins");
	pincheckbox.addEventListener("click", function(){
		togglelayers(PinLayer,pincheckbox.checked)
	});
	
	/*
	document.getElementById("Layer-ColoredMarkers").addEventListener("click", function(){
		if (document.getElementById("Layer-ColoredMarkers").checked && (olMap.ol.Map.getLayers().includes(ColoredMarkerLayer) == false) ) {olMap.addLayer(ColoredMarkerLayer)};
		if (document.getElementById("Layer-ColoredMarkers").checked == false && olMap.ol.Map.getLayers().includes(ColoredMarkerLayer) ) {olMap.removeLayer(ColoredMarkerLayer)}
	});
	*/
	
	var krigingcheckbox = document.getElementById("Layer-Kriging");
	krigingcheckbox.addEventListener("click", function(){
		togglelayers("WFSVectorLayer",krigingcheckbox.checked)
	});
	
	
});
