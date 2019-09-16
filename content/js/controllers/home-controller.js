gostApp.controller('HomeCtrl', function ($scope, $http, $routeParams) {
	$scope.id = "saqn:home:";
	$scope.Page.setTitle('smartAQnet');
	$scope.Page.setHeaderIcon('');

	$http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastreams/phenomenonTime%20lt%20now()%20sub%20duration%27P1d%27&$count=true&$top=0").then(function (response) {
		$scope.active_devices = response.data["@iot.count"];
	});

	var interval=60000;
	var lasttime=null;
	var lastcount;
	var count=0;



	// $http.get(getUrl() + "/v1.0/Observations?$top=0&$count=true").then(function (response) {
	// 	$scope.n_observations=response.data["@iot.count"];
	// });	


/*
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

	$scope.$on('$destroy',function(){
		interval=0;
	});

	$scope.mapVisible = true;
	
});
