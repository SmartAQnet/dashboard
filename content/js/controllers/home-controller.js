gostApp.controller('HomeCtrl', function ($scope, $http, $routeParams, $timeout) {
	$scope.id = "saqn:home:";
	$scope.Page.setTitle('smartAQnet');
	$scope.Page.setHeaderIcon('');


	$scope.disclaimer=true;
	$scope.toggleDisclaimer=function(){
		$scope.disclaimer=!$scope.disclaimer
	}

	/*
	// fastest but least accurate: get number of observations and count with fixed +1 per 0.413 sec up (at ~40 devices)
	$http.get(getUrl() + "/v1.0/Observations?$top=1&$count=true").then(function (response) {
	$scope.n_observations=response.data["@iot.count"];

	$scope.setObservations=function(){
		$scope.n_observations++
		$scope.obs_string = $scope.n_observations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		$scope.$apply()
		window.setTimeout($scope.setObservations, interval);
	};
	window.setTimeout($scope.setObservations, 0);
	});
	*/

	/*	
	var interval=60000;
	var lasttime=null;
	var lastcount;
	var count=0;
	*/

	/*
	//slow: get count right now, wait a little, calculate frequency and count and check back occasionally
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
			$scope.obs_string = $scope.n_observations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			count--; 
			if(interval>0) window.setTimeout($scope.setObservations, interval);
		}
		$scope.$apply()
	};
	*/




	/*
	//slowest: get count 60sec ago, get count right now, calculate frequency between these two and count from the 60s ago count upwards. when reaching the "now" count, repeat. 
	$http.get(getUrl() + "/v1.0/Observations?$top=0&$filter=phenomenonTime%20lt%20now()%20sub%20duration%27PT60s%27&$count=true").then(function (response) {
		count60sago=response.data["@iot.count"]
		$scope.n_observations=count60sago;

		$scope.setObservations=function(){
			if(count==0)
			{
					$http.get(getUrl() + "/v1.0/Observations?$top=0&$filter=phenomenonTime%20lt%20now()%20sub%20duration%27PT30s%27&$count=true").then(function (response) {
						count30sago=response.data["@iot.count"]
						count = count30sago - $scope.n_observations;
						interval = 30000/count;
						window.setTimeout($scope.setObservations, 0);
					});
				
			}
			else
			{
				$scope.n_observations++;
				$scope.obs_string = $scope.n_observations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
				count--; 
				if(interval>0) window.setTimeout($scope.setObservations, interval);
			}
			$scope.$apply()
		};

		window.setTimeout($scope.setObservations, 0);
	});
	*/
	$scope.$on('$destroy',function(){
		//interval=0;
	});

	$scope.mapVisible = true;
	
});
