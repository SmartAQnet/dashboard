gostApp.controller('HomeCtrl', function ($scope, $http) {
	$scope.Page.setTitle('smartAQnet');
	$scope.Page.setHeaderIcon('');

	$http.get(getUrl() + "/v1.0/Things?$filter=datastreams/Observations/phenomenontime%20gt%20now()%20sub%20duration%27P1d%27&$count=true").then(function (response) {
		$scope.active_devices = response.data["@iot.count"];
	});

	var interval=5000;
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
			});
		}
		else
		{	
			$scope.n_observations++;
			count--; 
		}
		$scope.$apply()
		window.setTimeout($scope.setObservations, interval);
	}
	window.setTimeout($scope.setObservations, 0);
});
