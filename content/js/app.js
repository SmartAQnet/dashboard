//First line should be empty or a comment (this comment). Line is overwritten by the docker-entrypoint script
var gostApp = angular.module('gostApp', ['ngRoute', 'vs-repeat', 'rzSlider']);

gostApp.run(function($rootScope, $window) {
	$rootScope.$window = $window;
	/* This function allows to trigger AngularJS' recalculation if the scope was externally changed */
	$rootScope.safeApply = function(fn) {
		if(!this.$root) return;
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};
});

gostApp.factory('Page', function () {
    var title = 'SmartAQnet';
    return {
        title: function () { return title; },
        setTitle: function (newTitle) { title = newTitle; }
    };
});

// Set routes
gostApp.config(function ($routeProvider) {
	$routeProvider.
		when('/home', { templateUrl: window.dashboardSettings.root + 'views/home.html', controller: "HomeCtrl", activetab: 'home' }).
		when('/thing/:id', { templateUrl: window.dashboardSettings.root + 'views/thing.html', controller: "ThingCtrl", activetab: 'things' }).
		when('/things', { templateUrl: window.dashboardSettings.root + 'views/things.html', controller: "ThingsCtrl", activetab: 'things' }).
		when('/locations', { templateUrl: window.dashboardSettings.root + 'views/locations.html', controller: "LocationsCtrl", activetab: 'things' }).
		when('/historicallocations', { templateUrl: window.dashboardSettings.root + 'views/historicallocations.html', controller: "HistoricalLocationsCtrl", activetab: 'things' }).
		when('/sensors', { templateUrl: window.dashboardSettings.root + 'views/sensors.html', controller: "SensorsCtrl", activetab: 'sensors' }).
		when('/sensor/:id', { templateUrl: window.dashboardSettings.root + 'views/sensor.html', controller: "SensorCtrl", activetab: 'sensors' }).
		when('/observedproperty/:id', { templateUrl: window.dashboardSettings.root + 'views/observedproperty.html', controller: "ObservedPropertyCtrl", activetab: 'properties' }).
		when('/observedproperties', { templateUrl: window.dashboardSettings.root + 'views/observedproperties.html', controller: "ObservedPropertiesCtrl", activetab: 'properties' }).
		when('/datastream/:id', { templateUrl: window.dashboardSettings.root + 'views/datastream.html', controller: "DatastreamCtrl", activetab: 'things' }).
		when('/datastreams', { templateUrl: window.dashboardSettings.root + 'views/datastreams.html', controller: "DatastreamsCtrl", activetab: 'sensors' }).
		when('/observations', { templateUrl: window.dashboardSettings.root + 'views/observations.html', controller: "ObservationsCtrl", activetab: 'sensors' }).
		when('/featuresofinterest', { templateUrl: window.dashboardSettings.root + 'views/featuresofinterest.html', controller: "FeaturesOfInterestCtrl" }).
		when('/create_new', { templateUrl: window.dashboardSettings.root + 'views/create_new.html', controller: "CreateNewCtrl" }).
		//when('/:type/:id/patch', { templateUrl: window.dashboardSettings.root + 'views/patch.html', controller: "PatchCtrl" }).
		when('/mqtt', { templateUrl: window.dashboardSettings.root + 'views/mqtt.html', controller: "MqttCtrl" }).
		otherwise({redirectTo: '/home' });
});

var iconThing = "fa-cube";
var iconDatastream = "fa-line-chart";
var iconFeatureOfInterest = "fa-map";
var iconHistoricalLocation = "fa-history";
var iconLocation = "fa-map-marker";
var iconObservation = "fa-eye";
var iconSensor = "fa-tachometer-alt";
var iconObservedProperty = "fa-list";

function getSSLEnabled() {
	return location.protocol == 'https:'
}


function getUrl() {
	if (typeof stURL !== 'undefined') {
		return stURL   
	} else if (window.location.protocol.localeCompare("file:"  !== '0')) {
		return "https://api.smartaq.net"
		//return "https://smartaqnet-dev.dmz.teco.edu"
	}
	return "";
}

function getId(id) {
	return isNaN(id)?"'"+encodeURIComponent(id)+"'":id;
}

function guid() {
	function s4() { 
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}


var getLocation = function(href) {
	var l = document.createElement("a");
	l.href = href;
	return l;
};

function getWebsocketUrl() {    
	if (typeof wsURL !== 'undefined' && wsURL != "") {
		return wsURL   
	} else {
		var scheme = getSSLEnabled() ? "wss://" : "ws://";
		return scheme + getLocation(getUrl()).hostname + "/mqtt"
	}   
}
