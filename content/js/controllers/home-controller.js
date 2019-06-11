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
	
	var kriginglocations = [];
	var krigingvalues = [];
	
	//get pm10 datastreams, recent observation value for color and feature of interest for location
	$http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27saqn:op:mcpm10%27&$expand=Observations($top=1;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
		$scope.alldatastreams = response.data.value;
		angular.forEach($scope.alldatastreams, function (value, key) {
			if (value["Observations"].length > 0){
			$scope.obsresult = value["Observations"][0]["result"];
			$scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
			krigingvalues.push($scope.obsresult);
			kriginglocations.push([$scope.obsFOI["coordinates"][0],$scope.obsFOI["coordinates"][1]]);
			addGeoJSONcolorFeature($scope.obsFOI,$scope.obsresult);
			}
		
		});
		krigstuff(kriginglocations,krigingvalues);
		//zoomToGeoJSONLayerExtent(); leave default here because otherwise it would just show the entire world
	});
	

	//Default Layers at page loading
	togglelayers(PinLayer,true);
	togglelayers(ColoredMarkerLayer,false);
	togglelayers(WFSVectorLayer,false);
	togglelayers(SimulationLayer,false);
	

	

	var pincheckbox = document.getElementById("Layer-Pins");
	pincheckbox.addEventListener("click", function(){
		togglelayers(PinLayer,pincheckbox.checked)
	});
	
	var coloredmarkercheckbox = document.getElementById("Layer-ColoredMarkers");
	coloredmarkercheckbox.addEventListener("click", function(){
		togglelayers(ColoredMarkerLayer,coloredmarkercheckbox.checked)
	});

	var krigingcheckbox = document.getElementById("Layer-Kriging");
	krigingcheckbox.addEventListener("click", function(){
		togglelayers(canvasLayer,krigingcheckbox.checked)
	});

	
	//run simulation per default on invisible layer
	var amountofsimulations = setupsimulations(5);
	

	var redraw_sim = function(){
		for (let i=0; i <= amountofsimulations-1; i++) {
		simulate(i,totalspeed[i]);
		};
		//krigstuff(randomlocation,randomvalue);
		//canvasLayer.getSource().changed();
		window.setTimeout(redraw_sim, 1000);
	};

	
	


	window.setTimeout(redraw_sim, 0);

	//var intervaltimer =  window.setTimeout(, 1000);
	

	var simulationcheckbox = document.getElementById("Layer-Simulation");
	simulationcheckbox.addEventListener("click", function(){
		togglelayers(SimulationLayer,simulationcheckbox.checked)
	});
	


	
    
	var autorefreshcheckbox = document.getElementById("auto-refresh");
	var autorefreshtimer;
	autorefreshcheckbox.addEventListener("change", function(){
		if (autorefreshcheckbox.checked){
			autorefreshtimer = window.setInterval(function(){MapRefresh();
			SimulationLayer.getSource().changed();}, 1000) 
		}
		else
		{
			window.clearInterval(autorefreshtimer)
		}
	});


	
});
