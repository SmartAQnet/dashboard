gostApp.controller('saqnModelCtrl', function ($scope, $http, $routeParams, Page) {

  $scope.Page.setHeaderIcon(iconThing);


  $(".iconSensor").addClass(iconSensor)
  $(".iconThing").addClass(iconThing)
  $(".iconObservedProperty").addClass(iconObservedProperty)
  $(".iconObservation").addClass(iconObservation)
  $(".iconDatastream").addClass(iconDatastream)
  $(".iconLocation").addClass(iconLocation)
  

  document.getElementById('sensorPic').src = window.dashboardSettings.root + 'assets/model/Sensor.png'
  document.getElementById('thingPic').src = window.dashboardSettings.root + 'assets/model/Thing.png'
  document.getElementById('obspropPic').src = window.dashboardSettings.root + 'assets/model/ObservedProperty.png'
  document.getElementById('observationPic').src = window.dashboardSettings.root + 'assets/model/Observation.png'
  document.getElementById('datastreamPic').src = window.dashboardSettings.root + 'assets/model/Datastream.png'
  document.getElementById('locationPic').src = window.dashboardSettings.root + 'assets/model/Location.png'

  //control bootstrap classes for hover etc
  $(".modelbutton" ).hover(
      function() {
        $(this).addClass('shadow').css('cursor', 'pointer'); 
      }, function() {
        $(this).removeClass('shadow');
      }
    );



});
