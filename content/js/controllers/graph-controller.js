gostApp.controller('GraphCtrl', function ($scope, $http, $routeParams, Page) {



/*
    $scope.$on("mapClickCoordinates", function(evt, data){
        console.log("User clicked on map at: ")
        console.log(data)
        $scope.$parent.showGraph = true
        var gpsdata = data

        // get information and construct the graph
        $http.get("https://api.smartaq.net/v1.0/Datastreams('saqn%3Ads%3A54d339b')/Observations").then(function(response){

            var res = response.data.value.slice(0,100);

            var resValues = res.map(el => el["result"]);
            var resLabels = res.map(el => el["resultTime"]);

            var ctx = document.getElementById('simulationGraph').getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: resLabels,
                    datasets:[{
                        label: "PM 2.5", 
                        steppedLine: "after", 
                        data: resValues, 
                        borderColor: "rgba(115,135,156,1)",
                        fill: false, 
                    }]
                }, 
                options: {
                    responsive: true,
                    aspectRatio: 2,
                    title: {
                        display: true,
                        text: "Forecast at " + gpsdata,
                    },
                    scales: {
                        xAxes: [{
                            type: 'time', 
                            time: {
                                unit: 'minute'
                            }
                        }]
                    }
                }
            });
        });
    
    });

*/
});
