function Stream(id, isLive) {
    this.baseURL = getUrl() + "/v1.0/Datastreams(" + getId(id) + ")";
    this.dataset = [];
    this.datasetDownsampled = [];
    this.isLive = typeof isLive === "undefined" ? true : isLive;
    this.cacheLive = [];
    this.id = id;
    this.streamData = { //is loaded in prototype.loadPropertyDescription
        "unitOfMeasurement" : {
            "name" : null,
            "symbol" : null,
            "definition" : null
          },
          "ObservedProperty" : {
            "name" : null,
            "description" : null,
            "definition" : null,
            "@iot.id" : null,
            "@iot.selfLink" : null
          }
    }
}

Stream.prototype.getFromServer = function($http, handleHttpError, callback){
    $http.get(this.baseURL + "/Observations?$orderby=phenomenonTime desc&$top=1").then(function (r) {
        if(!r.data.value[0]){
            //no data
            callback();
            return;
        }
        var endDate = moment(r.data.value[0]['phenomenonTime']);
        var startDate = moment(endDate).subtract(1, 'days');
        this.getFromServerDateTime($http, handleHttpError, startDate, endDate, callback);
    }.bind(this)).catch((function(error){
        handleHttpError(error, this.id);
    }).bind(this));
}

Stream.prototype.getFromServerDateTime = function($http, handleHttpError, start, end, callback){
    $http.get(this.baseURL + "/Observations?$filter=phenomenonTime gt " + start.toISOString() + " and phenomenonTime lt "+ end.toISOString() +"&$orderby=phenomenonTime desc&$top=10000").then(function (response) {
        this.dataset.length = 0;
        response.data.value.forEach(function (value, key) {
            this.addDataPoint(value, false);
        }.bind(this));
        this.datasetDownsampled.length = 0;
        var downsampled = downsampleToResolution(this.dataset, 600);
        downsampled.forEach(function(point){
            this.datasetDownsampled.push(point);
        }.bind(this));
        callback();
    }.bind(this)).catch((function(error){
        handleHttpError(error, this.id);
    }).bind(this));
}

Stream.prototype.setLive = function(isLive){
    this.isLive = isLive;
    if(isLive){
        this.commitLiveData();
    }
}

Stream.prototype.loadPropertyDescription = function($http, handleHttpError, callback){
    $http.get(this.baseURL + "?$expand=ObservedProperty").then(function (r) {
        this.streamData["unitOfMeasurement"] = r.data["unitOfMeasurement"];
        this.streamData["ObservedProperty"] = r.data["ObservedProperty"];
        callback();
    }.bind(this)).catch((function(error){
        handleHttpError(error, this.id);
    }).bind(this));
}

Stream.prototype.commitLiveData = function(){
    this.cacheLive.reverse().forEach(function(point){
        this.addDataPoint(point, "unshift", true);
    }.bind(this));
    this.cacheLive.length = 0;
}

Stream.prototype.addDataPoint = function(value, method, isLive){
    method = method || "push";
    if (moment(value['phenomenonTime']).isValid()) {
        var point = {
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: value['phenomenonTime'],
            y: value['result']
        };
        if(isLive && !this.isLive){
            this.cacheLive[method](point);
        }
        else{
            this.dataset[method](point);
            this.datasetDownsampled[method](point);
        }
    } else {
        var interval = moment.interval(value['phenomenonTime']);
        var pointStart = {
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: interval.start(),
            y: value['result']
        };
        var pointEnd = {
            phenomenonTime: value['phenomenonTime'],
            result: value['result'],
            resultTime: value['resultTime'],
            x: interval.end(),
            y: value['result']
        };
        if(isLive && !this.isLive){
            this.cacheLive[method](pointStart);
            this.cacheLive[method](pointEnd);
        }
        else{
            this.dataset[method](pointStart);
            this.dataset[method](pointEnd);
            this.datasetDownsampled[method](pointStart);
            this.datasetDownsampled[method](pointEnd);
        }
    }
}

Datastreams.states = {
    "none_loaded": "none_loaded",
    "main_loading": "main_loading",
    "main_loaded": "main_loaded",
    "secondary_loading": "secondary_loading",
    "secondary_loaded": "secondary_loaded",
    "adjusting_timeframe": "adjusting_timeframe"
}

function Datastreams($http, ...ids){
    this.client = this.getMQTTClient();
    this.streams = {};
    this.reverseURLToIDLookup = {};
    this.isClientConnected = false;
    this.chart = null;
    this.listeners = [];
    this.$http = $http;
    this.state = Datastreams.states["none_loaded"];
    this.stateAdditionalInformation = "";
    this.isLive = true;
}

Datastreams.prototype.setLive = function(isLive){
    Object.keys(this.streams).forEach(function(key){
        this.streams[key].setLive(isLive);
    }.bind(this));
    this._dataChanged();
}

Datastreams.prototype.setState = function(state){
    this.state = state;
    this.notify();
}

Datastreams.prototype.notify = function(){
    this.listeners.forEach(function(callback){
        callback();
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
        stream.addDataPoint(r, "unshift", true);
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

Datastreams.prototype.adjustDatetimeRange = function($http, start, end){
    this.setState(Datastreams.states["adjusting_timeframe"]);
    var streamLength = Object.keys(this.streams).length;
    var currentStream = 0;
    Object.keys(this.streams).forEach(function(key){
        this.streams[key].getFromServerDateTime($http, this.handleHttpError.bind(this), start, end, function(){
            currentStream++;
            if(currentStream >= streamLength){
                //all streams reloaded
                if(streamLength == 1){
                    this.setState(Datastreams.states["main_loaded"]);
                }
                else{
                    this.setState(Datastreams.states["secondary_loaded"]);
                }
                this._dataChanged();
            }
        }.bind(this));
    }.bind(this));
}

Datastreams.prototype.handleHttpError = function(error, streamId){
    $.snackbar({content: "The request was not successfull " + error.status});
    switch(this.state){
        case Datastreams.states["main_loading"]:
        case Datastreams.states["secondary_loading"]:
            if(streamId){
                this.removeStream(streamId);
            }
            break;
        case Datastreams.states["adjusting_timeframe"]:
            if (Object.keys(this.streams).length == 0){
                this.setState(Datastreams.states["none_loaded"]);
            }
            else if (Object.keys(this.streams).length == 1){
                this.setState(Datastreams.states["main_loaded"]);
            }
            else{
                this.setState(Datastreams.states["secondary_loaded"]);
            }
        break;
    }
}

Datastreams.prototype.addStream = function (id, startMoment, endMoment) {
    this.streams[id] = new Stream(id, this.isLive);
    if (Object.keys(this.streams).length == 1){
        this.setState(Datastreams.states["main_loading"]);
    }
    else{
        this.setState(Datastreams.states["secondary_loading"]);
    }
    this.streams[id].loadPropertyDescription(this.$http, this.handleHttpError.bind(this), function(){
        function afterGetCallback(){
            console.log("initial data load finished");
            if (Object.keys(this.streams).length == 1){
                this.setState(Datastreams.states["main_loaded"]);
            }
            else{
                this.setState(Datastreams.states["secondary_loaded"]);
            }
            this._dataChanged();
        }
        if(startMoment && endMoment){
            this.streams[id].getFromServerDateTime(this.$http, this.handleHttpError.bind(this), startMoment, endMoment, afterGetCallback.bind(this));
        }
        else{
            this.streams[id].getFromServer(this.$http, this.handleHttpError.bind(this), afterGetCallback.bind(this));
        }
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
    if (Object.keys(this.streams).length == 0){
        this.setState(Datastreams.states["none_loaded"]);
    }
    else{
        this.setState(Datastreams.states["main_loaded"]);
    }
    this.toChart();
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
        var yAxes = this.getUpdatedChartAxes();
        this.chart.options.scales.yAxes = yAxes;
        if(yAxes.length == 1 && this.chart.data.datasets.length > 1){
            this.chart.data.datasets[1].yAxisID = "main";
        }
		this.chart.update();	
    }
    this.notify();
}

Datastreams.prototype.addDataChangeListener = function(callback){
    this.listeners.push(callback);
}

Datastreams.prototype.removeDataChangeListener = function(callback){
    var index = this.listeners.indexOf(callback);
    if (index !== -1) this.listeners.splice(index, 1);
}

Datastreams.prototype.getUpdatedChartAxes = function(){
    var axisLabels = Object.keys(this.streams).map(function(id){
        var propertyName = this.streams[id].streamData.ObservedProperty.name;
        var symbolName = ({ // Dictionary to override symbol names with fallback to API reported name
            "degC": "°C"
        })[this.streams[id].streamData.unitOfMeasurement.symbol] || this.streams[id].streamData.unitOfMeasurement.symbol;
        return {symbolName: symbolName, propertyName: propertyName};
    }.bind(this));

    if(axisLabels[0] && axisLabels[1] && axisLabels[0].symbolName == axisLabels[1].symbolName){ //Two streams, same unit -> one axis
        var labelString = axisLabels[0].propertyName + " [" + axisLabels[0].symbolName + "]" + " / " + //both labels if different property names
        axisLabels[1].propertyName + " [" + axisLabels[1].symbolName + "]";
        if(axisLabels[0].propertyName == axisLabels[1].propertyName){ // only one label if same property names (prevents duplicate label)
            labelString = axisLabels[0].propertyName + " [" + axisLabels[0].symbolName + "]";
        }
        return [{
            id: 'main',
            type: 'linear',
            position: 'left',
            scaleLabel: {
                display: true,
                labelString: labelString,
                fontColor: "#000"
            },
            ticks: {
                beginAtZero:false
            }
        }];
    }

    var axisLabelsStrings = axisLabels.map(function(label){
        return (label.symbolName) ? label.propertyName + " [" + label.symbolName + "]" : null;
    });

    var yAxes = (Object.keys(this.streams).length > 1) ? [{ //Show both axes if more than one datastream
        id: 'main',
        type: 'linear',
        position: 'left',
        scaleLabel: {
            display: !!axisLabelsStrings[0],
            labelString: axisLabelsStrings[0],
            fontColor: Datastreams.getColorSchemes()[0].fontColor
        },
        ticks: {
            beginAtZero:false
        }
    },{
        id: 'secondary',
        type: 'linear',
        position: 'right',
        scaleLabel: {
            display: !!axisLabelsStrings[1],
            labelString: axisLabelsStrings[1],
            fontColor: Datastreams.getColorSchemes()[1].fontColor
        },
        ticks: {
            beginAtZero:false
        }
    }] : [{ //Show one axis otherwise
        id: 'main',
        type: 'linear',
        position: 'left',
        scaleLabel: {
            display: !!axisLabelsStrings[0],
            labelString: axisLabelsStrings[0],
            fontColor: "#000"
        },
        ticks: {
            beginAtZero:false
        }
    }];

    document.getElementById("unitOfMeasurementone").innerHTML = axisLabels[0]["symbolName"];
    if (Object.keys(this.streams).length > 1) {
        try{
            setTimeout(function(){document.getElementById("unitOfMeasurementtwo").innerHTML = axisLabels[1]["symbolName"];
                document.getElementById("unitOfMeasurementone").innerHTML = axisLabels[0]["symbolName"]}, 1000)
        }
        catch(e){console.log("we get an error like:" + e)} //warum ignoriert er das komplett?
    };

    return yAxes;
}

Datastreams.getColorSchemes = function(){
    return[
        {
            backgroundColor: "rgba(115,135,156,0.15)",
            borderColor: "rgba(115,135,156,1)",
            pointBorderColor: "rgba(115,135,156,1)",
            pointBackgroundColor: "#fff",
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            fontColor: "rgba(115,135,156,1)"
        },
        {
            backgroundColor: "rgba(172, 110, 98, 0.15)",
            borderColor: "rgba(172, 110, 98, 1)",
            pointBorderColor: "rgba(172, 110, 98, 1)",
            pointBackgroundColor: "#fff",
            pointHoverBackgroundColor: "rgba(236, 68, 34, 1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            fontColor: "rgba(172, 110, 98, 1)"
        }
    ]
}

Datastreams.prototype.toChart = function(htmlSelector){
    var htmlSelector = htmlSelector || this.htmlSelector;
    this.htmlSelector = htmlSelector;
    if(this.chart != null){
		this.chart.destroy();	
	}

	Chart.defaults.global.responsive = true;
	Chart.defaults.global.maintainAspectRatio = false;
    Chart.defaults.global.legend.display = false;
    var axesNames = ["main", "secondary"];
    var colorSchemes = Datastreams.getColorSchemes();
    var yAxes = this.getUpdatedChartAxes();
	var chartData = {
		datasets: Object.keys(this.streams).map(function(id, indexOfDataset){
            indexOfDataset = Math.min(indexOfDataset++, yAxes.length);
            var axisName = axesNames[indexOfDataset];
            var colorScheme = colorSchemes[indexOfDataset];
            return {
				fill: true,
				lineTension: 0.1,
				backgroundColor: colorScheme.backgroundColor,
				borderColor: colorScheme.borderColor,
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',

                yAxisID: axisName,
                data: this.streams[id].datasetDownsampled,
                showLine: true
			};
        }.bind(this))
    }

	var ctx = $(htmlSelector);
    ctx.innerHTML = "";
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
    window.chart = this.chart;
}

function downsampleToResolution(data, targetLength) {
    var dataLength = data.length;
    if (targetLength >= dataLength || targetLength === 0) {
        return data; // data has target size
    }
    var output = [];
    // bucket size, leave room for start and end data points
    var bucksetSize = (dataLength - 2) / (targetLength - 2);
    var a = 0; // initially a is the first point in the triangle
    var maxAreaPoint;
    var maxArea;
    var area;
    var nextA;
    // always add the first point
    output.push(data[a]);
    for (var i = 0; i < targetLength - 2; ++i) {
        // Calculate point average for next bucket (containing c)
        var avgX = 0;
        var avgY = 0;
        var avgRangeStart = Math.floor((i + 1) * bucksetSize) + 1;
        var avgRangeEnd = Math.floor((i + 2) * bucksetSize) + 1;
        avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
        var avgRangeLength = avgRangeEnd - avgRangeStart;
        for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
            avgX += getSimpleTime(data[avgRangeStart]);
            avgY += data[avgRangeStart].y * 1;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;
        // Get the range for this bucket
        var rangeOffs = Math.floor((i + 0) * bucksetSize) + 1;
        var rangeTo = Math.floor((i + 1) * bucksetSize) + 1;
        // Point a
        var pointA = data[a];
        var pointAX = getSimpleTime(pointA);
        var pointAY = pointA.y * 1;
        maxArea = area = -1;
        for (; rangeOffs < rangeTo; rangeOffs++) {
            // Calculate triangle area over three buckets
            area = Math.abs((pointAX - avgX) * (data[rangeOffs].y - pointAY) -
                (pointAX - getSimpleTime(data[rangeOffs])) * (avgY - pointAY)) * 0.5;
            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = data[rangeOffs];
                nextA = rangeOffs; // Next a is this b
            }
        }
        output.push(maxAreaPoint); // Pick this point from the bucket
        a = nextA; // This a is the next a (chosen b)
    }
    output.push(data[dataLength - 1]); // Always add last
    return output;
};

function getSimpleTime (point) {
    var x = point.x || point.t;
    if (typeof x === "number") {
        return x;
    }
    else if (typeof x === "string") {
        return new Date(x).getTime();
    }
    else {
        return x.getTime();
    }
};