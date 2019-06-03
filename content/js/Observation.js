function Stream(id) {
    this.baseURL = getUrl() + "/v1.0/Datastreams(" + getId(id) + ")";
    this.dataset = [];
}

Stream.prototype.getFromServer = function($http, callback){
    $http.get(this.baseURL + "/Observations?$orderby=phenomenonTime desc&$top=1").then(function (r) {
        $http.get(this.baseURL + "/Observations?$filter=phenomenonTime gt "+r.data.value[0]['phenomenonTime'] +" sub duration'P1d'&$orderby=phenomenonTime desc&$top=10000").then(function (response) {
            this.dataset.length = 0;
            response.data.value.forEach(function (value, key) {
                this.addDataPoint(value);
            }.bind(this));
            callback();
        }.bind(this));
    }.bind(this));
}

Stream.prototype.addDataPoint = function(value, method){
    method = method || "push";
    if (moment(value['phenomenonTime']).isValid()) {
        this.dataset[method]({
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: value['phenomenonTime'],
            y: value['result']
        });
    } else {
        var interval = moment.interval(value['phenomenonTime']);
        this.dataset[method]({
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: interval.start(),
            y: value['result']
        });
        this.dataset[method]({
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: interval.end(),
            y: value['result']
        });
    }
}

function Datastreams($http, ...ids){
    this.client = this.getMQTTClient();
    this.streams = {};
    this.reverseURLToIDLookup = {};
    this.isClientConnected = false;
    this.chart = null;
    this.listeners = [];
    this.$http = $http;

    ids.forEach(function(id){
        this.addStream(id);
    });
}

Datastreams.prototype.getMQTTClient = function(){
    var client = new Paho.MQTT.Client(getWebsocketUrl(), guid());
    client.onConnectionLost = this._onConnectionLost.bind(this);
    client.onMessageArrived = this._onMessageArrived.bind(this);
    return client;
}

Datastreams.prototype.connectMQTTClient = function(){
    this.client.connect({ onSuccess: this._onConnect.bind(this), useSSL: getSSLEnabled() });
}

Datastreams.prototype._onConnectionLost = function (responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
    this.isClientConnected = false;
}

Datastreams.prototype._onMessageArrived = function (message) {
    var id = this.reverseURLToIDLookup[message.destinationName];
    if(!id) {
        throw Error("Unknown datastream in MQTT response: " + message.destinationName);
    }
    try {
        var r = JSON.parse(message.payloadString);
        var stream = this.streams[id];
        stream.addDataPoint(r, "unshift");
        this._dataChanged();
    }
    catch(err) {

    }
}

Datastreams.prototype._onConnect = function (message) {
    this.isClientConnected = true;
    this._subscribeToStreams();
}

Datastreams.prototype._subscribeToStreams = function () {
    Object.keys(this.streams).forEach(function(key){
        this._subscribe(key);
    }.bind(this));
}

Datastreams.prototype.addStream = function (id) {
    this.streams[id] = new Stream(id);
    this.streams[id].getFromServer(this.$http, function(){
        console.log("initial data load finished");
        this._dataChanged();
    }.bind(this));
    if(this.isClientConnected){
        this._subscribe(id);
    }
    else{
        this.connectMQTTClient();
    }
    return this.streams[id];
}

Datastreams.prototype._subscribe = function(id){
    if(!this.streams[id]){
        throw Error("Datastream with id " + id + "not initialized");
    }
    this.client.subscribe("v1.0/Datastreams(" + getId(id) + ")/Observations");
    this.reverseURLToIDLookup["v1.0/Datastreams(" + getId(id) + ")/Observations"] = id;
    console.log("v1.0/Datastreams(" + getId(id) + ")/Observations subscribed");
}

Datastreams.prototype.removeStream = function (id) {
    this.client.unsubscribe("v1.0/Datastreams(" + getId(id) + ")/Observations");
    delete this.streams[id];
}

Datastreams.prototype.removeAllStreams = function (id) {
    Object.keys(this.streams).forEach(function(key){
        this.removeStream(key);
    }.bind(this));
}

Datastreams.prototype.disconnectMQTTClient = function () {
    this.client.disconnect();
}

Datastreams.prototype._dataChanged = function(){
    console.log("Data changed");
    if(this.chart != null){
		this.chart.update();	
    }
    this.listeners.forEach(function(callback){
        callback();
    });
}

Datastreams.prototype.addDataChangeListener = function(callback){
    this.listeners.push(callback);
}

Datastreams.prototype.removeDataChangeListener = function(callback){
    var index = this.listeners.indexOf(item);
    if (index !== -1) this.listeners.splice(index, 1);
}

Datastreams.prototype.toChart = function(htmlSelector){
    if(this.chart != null){
		this.chart.destroy();	
	}

	Chart.defaults.global.responsive = true;
	Chart.defaults.global.maintainAspectRatio = false;
    Chart.defaults.global.legend.display = false;
    var axesNames = ["main", "secondary"];
    var indexOfDataset = 0;
	var chartData = {
		datasets: Object.keys(this.streams).map(function(id){
            var axisName = axesNames[indexOfDataset++]
            return {
				fill: true,
				lineTension: 0.1,
				backgroundColor: "rgba(115,135,156,0.15)",
				borderColor: "rgba(115,135,156,1)",
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: "rgba(115,135,156,1)",
				pointBackgroundColor: "#fff",
				pointBorderWidth: 1,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: "rgba(75,192,192,1)",
				pointHoverBorderColor: "rgba(220,220,220,1)",
				pointHoverBorderWidth: 2,
				pointRadius: 2,
                pointHitRadius: 10,
                yAxisID: axisName,
                data: this.streams[id].dataset,
                showLine: true
			};
        }.bind(this))
    }

	var ctx = $(htmlSelector);
    ctx.innerHTML = "";
    
    var yAxes = (Object.keys(this.streams).length > 1) ? [{ //Show both axes if more than one datastream
        id: 'main',
        type: 'linear',
        position: 'left',
        ticks: {
            beginAtZero:false
        }
    },{
        id: 'secondary',
        type: 'linear',
        position: 'right',
        ticks: {
            beginAtZero:false
        }
    }] : [{ //Show one axis otherwise
        id: 'main',
        type: 'linear',
        position: 'left',
        ticks: {
            beginAtZero:false
        }
    }];

	this.chart = new Chart(ctx, {
		type: 'scatter',
		data: chartData,
		options: {
			scales: {
				yAxes: yAxes,
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {
							minute: 'kk:mm'
						}
					}
				}]
			}
		}
	});
}