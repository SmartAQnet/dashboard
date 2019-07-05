var gostApp = angular.module('gostApp', ['ngRoute', 'vs-repeat']);

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
		when("/home", { templateUrl: '/dashboard/content/views/home.html', controller: "HomeCtrl", activetab: 'home' }).
		when('/thing/:id', { templateUrl: '/dashboard/content/views/thing.html', controller: "ThingCtrl", activetab: 'things' }).
		when("/things", { templateUrl: '/dashboard/content/views/things.html', controller: "ThingsCtrl", activetab: 'things' }).
		when('/locations', { templateUrl: '/dashboard/content/views/locations.html', controller: "LocationsCtrl", activetab: 'things' }).
		when('/historicallocations', { templateUrl: '/dashboard/content/views/historicallocations.html', controller: "HistoricalLocationsCtrl", activetab: 'things' }).
		when('/sensors', { templateUrl: '/dashboard/content/views/sensors.html', controller: "SensorsCtrl", activetab: 'sensors' }).
		when('/observedproperties', { templateUrl: '/dashboard/content/views/observedproperties.html', controller: "ObservedPropertiesCtrl", activetab: 'properties' }).
		when('/datastream/:id', { templateUrl: '/dashboard/content/views/datastream.html', controller: "DatastreamCtrl", activetab: 'things' }).
		when('/datastreams', { templateUrl: '/dashboard/content/views/datastreams.html', controller: "DatastreamsCtrl", activetab: 'sensors' }).
		when('/observations', { templateUrl: '/dashboard/content/views/observations.html', controller: "ObservationsCtrl", activetab: 'sensors' }).
		when('/featuresofinterest', { templateUrl: '/dashboard/content/views/featuresofinterest.html', controller: "FeaturesOfInterestCtrl" }).
		when('/mqtt', { templateUrl: '/dashboard/content/views/mqtt.html', controller: "MqttCtrl" }).
		otherwise({redirectTo: '/home' });
});

var iconThing = "fa-cube";
var iconDatastream = "fa-line-chart";
var iconFeatureOfInterest = "fa-map";
var iconHistoricalLocation = "fa-history";
var iconLocation = "fa-map-marker";
var iconObservation = "fa-eye";
var iconSensor = "fa-dashboard";
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
