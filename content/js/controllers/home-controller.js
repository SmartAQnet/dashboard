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
		$scope.allThings = response.data.value;
		angular.forEach($scope.allThings, function (value, key) {
			addGeoJSONFeature(value["Locations"][0]["location"]);
		});
	});
	
	var kriginglocations = [];
	var krigingvalues = [];
	

	//get pm10 datastreams, recent observation value for color, resulttime for id and feature of interest for location
	$scope.getAllObservations=function(){
		$http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27saqn:op:mcpm10%27&$expand=Observations($top=1;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
			$scope.alldatastreams = response.data.value;
			angular.forEach($scope.alldatastreams, function (value, key) {
				if (value["Observations"].length > 0){
				$scope.obsresult = value["Observations"][0]["result"];
				$scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
				$scope.obsresulttime = Date.parse(value["Observations"][0]["resultTime"]);
				krigingvalues.push($scope.obsresult);
				kriginglocations.push([$scope.obsFOI["coordinates"][0],$scope.obsFOI["coordinates"][1]]);
				addGeoJSONcolorFeature($scope.obsFOI,$scope.obsresult,$scope.obsresulttime);
				}
			
			});
		});
	};

	window.setTimeout($scope.getAllObservations,0)

	//Default Layers at page loading
	togglelayers(PinLayer,true);
	togglelayers(ColoredMarkerLayer,false);
	togglelayers(canvasLayer,false);

	//Default Layers at page loading
	togglecontrols(legend,false);
	togglecontrols(testcontrol,true);
	

	var pincheckbox = document.getElementById("Layer-Pins");
	pincheckbox.addEventListener("change", function(){
		togglelayers(PinLayer,pincheckbox.checked)
	});
	
	var coloredmarkercheckbox = document.getElementById("Layer-ColoredMarkers");
	coloredmarkercheckbox.addEventListener("change", function(){
		togglelayers(ColoredMarkerLayer,coloredmarkercheckbox.checked)
	});

	var krigingcheckbox = document.getElementById("Layer-Kriging");
	krigingcheckbox.addEventListener("change", function(){
		togglelayers(canvasLayer,krigingcheckbox.checked)
	});

	var refreshrate = 10000; //initial refresh rate
	
	var realradio = document.getElementById("Source-Real");
	realradio.addEventListener("click", function(){
		if (realradio.checked) {
			clearTimeout(runningsimulation);
			PinLayer.setSource(PinSource);
			ColoredMarkerLayer.setSource(ColoredMarkerSource);
			refreshrate = 10000}; 
	});
	
	var simulationradio = document.getElementById("Source-Simulation");
	simulationradio.addEventListener("click", function(){
		if (simulationradio.checked) {
			PinLayer.setSource(null);
			ColoredMarkerLayer.setSource(SimulationSource);
			refreshrate = 1000};
	});



	function UpdateMap(){
		if (simulationradio.checked){
			krigstuff(randomlocation,randomvalue);
			SimulationSource.clear();
			SimulationSource.addFeatures(SimulationInvisibleSource.getFeatures());
		};
		/*if (realradio.checked){ //cant get it to work properly, need to rework this
			$scope.getAllObservations; //function that grabs new features
			//need function here that removes old features
		};*/
		ColoredMarkerLayer.getSource().changed();
		canvasLayer.getSource().changed();
		 
	};

	var refreshbuttonclick = document.getElementById("refreshbutton");
	refreshbuttonclick.addEventListener("click", function(){UpdateMap()});

	//document.querySelector('input[name="Source"]:checked').value

	

	var runningsimulation;

	//run simulation in background on invisible layer
	var backroundsimulation = function(){
		for (let i=0; i <= amountofsimulations-1; i++) {
			simulate(i,totalspeed[i]);
		};
		runningsimulation = window.setTimeout(backroundsimulation, refreshrate);
	};

	
	var amountofsimulations = setupsimulations(50);
	window.setTimeout(backroundsimulation, 0);
	
    
	var autorefreshcheckbox = document.getElementById("auto-refresh");
	var autorefreshtimer;
	autorefreshcheckbox.addEventListener("change", function(){
		if (autorefreshcheckbox.checked){
				autorefreshtimer = window.setInterval(function(){UpdateMap()}, refreshrate)
			}
		else
		{
			window.clearInterval(autorefreshtimer)
		}
	});
});
