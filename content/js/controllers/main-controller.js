gostApp.controller('MainCtrl', function ($scope, $location, $http, Page, $routeParams, $route) {
    
    
    /*
    * [js-sha1]{@link https://github.com/emn178/js-sha1}
    *
    * @version 0.6.0
    * @author Chen, Yi-Cyuan [emn178@gmail.com]
    * @copyright Chen, Yi-Cyuan 2014-2017
    * @license MIT
    */
    !function(){"use strict";function t(t){t?(f[0]=f[16]=f[1]=f[2]=f[3]=f[4]=f[5]=f[6]=f[7]=f[8]=f[9]=f[10]=f[11]=f[12]=f[13]=f[14]=f[15]=0,this.blocks=f):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],this.h0=1732584193,this.h1=4023233417,this.h2=2562383102,this.h3=271733878,this.h4=3285377520,this.block=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}var h="object"==typeof window?window:{},s=!h.JS_SHA1_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;s&&(h=global);var i=!h.JS_SHA1_NO_COMMON_JS&&"object"==typeof module&&module.exports,e="function"==typeof define&&define.amd,r="0123456789abcdef".split(""),o=[-2147483648,8388608,32768,128],n=[24,16,8,0],a=["hex","array","digest","arrayBuffer"],f=[],u=function(h){return function(s){return new t(!0).update(s)[h]()}},c=function(){var h=u("hex");s&&(h=p(h)),h.create=function(){return new t},h.update=function(t){return h.create().update(t)};for(var i=0;i<a.length;++i){var e=a[i];h[e]=u(e)}return h},p=function(t){var h=eval("require('crypto')"),s=eval("require('buffer').Buffer"),i=function(i){if("string"==typeof i)return h.createHash("sha1").update(i,"utf8").digest("hex");if(i.constructor===ArrayBuffer)i=new Uint8Array(i);else if(void 0===i.length)return t(i);return h.createHash("sha1").update(new s(i)).digest("hex")};return i};t.prototype.update=function(t){if(!this.finalized){var s="string"!=typeof t;s&&t.constructor===h.ArrayBuffer&&(t=new Uint8Array(t));for(var i,e,r=0,o=t.length||0,a=this.blocks;r<o;){if(this.hashed&&(this.hashed=!1,a[0]=this.block,a[16]=a[1]=a[2]=a[3]=a[4]=a[5]=a[6]=a[7]=a[8]=a[9]=a[10]=a[11]=a[12]=a[13]=a[14]=a[15]=0),s)for(e=this.start;r<o&&e<64;++r)a[e>>2]|=t[r]<<n[3&e++];else for(e=this.start;r<o&&e<64;++r)(i=t.charCodeAt(r))<128?a[e>>2]|=i<<n[3&e++]:i<2048?(a[e>>2]|=(192|i>>6)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):i<55296||i>=57344?(a[e>>2]|=(224|i>>12)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):(i=65536+((1023&i)<<10|1023&t.charCodeAt(++r)),a[e>>2]|=(240|i>>18)<<n[3&e++],a[e>>2]|=(128|i>>12&63)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]);this.lastByteIndex=e,this.bytes+=e-this.start,e>=64?(this.block=a[16],this.start=e-64,this.hash(),this.hashed=!0):this.start=e}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},t.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,h=this.lastByteIndex;t[16]=this.block,t[h>>2]|=o[3&h],this.block=t[16],h>=56&&(this.hashed||this.hash(),t[0]=this.block,t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[14]=this.hBytes<<3|this.bytes>>>29,t[15]=this.bytes<<3,this.hash()}},t.prototype.hash=function(){var t,h,s=this.h0,i=this.h1,e=this.h2,r=this.h3,o=this.h4,n=this.blocks;for(t=16;t<80;++t)h=n[t-3]^n[t-8]^n[t-14]^n[t-16],n[t]=h<<1|h>>>31;for(t=0;t<20;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|~i&r)+o+1518500249+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|~s&e)+r+1518500249+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|~o&i)+e+1518500249+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|~r&s)+i+1518500249+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|~e&o)+s+1518500249+n[t+4]<<0,e=e<<30|e>>>2;for(;t<40;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o+1859775393+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r+1859775393+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e+1859775393+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i+1859775393+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s+1859775393+n[t+4]<<0,e=e<<30|e>>>2;for(;t<60;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|i&r|e&r)+o-1894007588+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|s&e|i&e)+r-1894007588+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|o&i|s&i)+e-1894007588+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|r&s|o&s)+i-1894007588+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|e&o|r&o)+s-1894007588+n[t+4]<<0,e=e<<30|e>>>2;for(;t<80;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o-899497514+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r-899497514+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e-899497514+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i-899497514+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s-899497514+n[t+4]<<0,e=e<<30|e>>>2;this.h0=this.h0+s<<0,this.h1=this.h1+i<<0,this.h2=this.h2+e<<0,this.h3=this.h3+r<<0,this.h4=this.h4+o<<0},t.prototype.hex=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return r[t>>28&15]+r[t>>24&15]+r[t>>20&15]+r[t>>16&15]+r[t>>12&15]+r[t>>8&15]+r[t>>4&15]+r[15&t]+r[h>>28&15]+r[h>>24&15]+r[h>>20&15]+r[h>>16&15]+r[h>>12&15]+r[h>>8&15]+r[h>>4&15]+r[15&h]+r[s>>28&15]+r[s>>24&15]+r[s>>20&15]+r[s>>16&15]+r[s>>12&15]+r[s>>8&15]+r[s>>4&15]+r[15&s]+r[i>>28&15]+r[i>>24&15]+r[i>>20&15]+r[i>>16&15]+r[i>>12&15]+r[i>>8&15]+r[i>>4&15]+r[15&i]+r[e>>28&15]+r[e>>24&15]+r[e>>20&15]+r[e>>16&15]+r[e>>12&15]+r[e>>8&15]+r[e>>4&15]+r[15&e]},t.prototype.toString=t.prototype.hex,t.prototype.digest=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return[t>>24&255,t>>16&255,t>>8&255,255&t,h>>24&255,h>>16&255,h>>8&255,255&h,s>>24&255,s>>16&255,s>>8&255,255&s,i>>24&255,i>>16&255,i>>8&255,255&i,e>>24&255,e>>16&255,e>>8&255,255&e]},t.prototype.array=t.prototype.digest,t.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(20),h=new DataView(t);return h.setUint32(0,this.h0),h.setUint32(4,this.h1),h.setUint32(8,this.h2),h.setUint32(12,this.h3),h.setUint32(16,this.h4),t};var y=c();i?module.exports=y:(h.sha1=y,e&&define(function(){return y}))}();
        
    var patchhash = "9ba4eb7944d7a3a953eb10937d877d0694377286"
    $scope.pwUserInput = ''

    //from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Alternative


    var patchhconfig = {headers: {"Content-Type": "application/json"}}

    $scope.faasurl = function(){return faasUrl()};

    $http.defaults.headers.post["Content-Type"] = "application/json";
    $http.defaults.headers.post["Accept"] = "application/json";

    $scope.Page = Page;
    $scope.$route = $route;
    $scope.$location = $location;

    $scope.Page.setHeaderIcon = function (icon) {
        $scope.headerIcon = 'fa ' + icon;
    };

    $scope.Page.go = function (path) {
        $location.path(path);
    };

    //initialize bootstrap tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })

    /** Functions that enforce FROST query language on dashboard tables */

    $scope.timeframe = {}
    
    //triggering ng-ifs for display
    $scope.dataIsLoaded = {}
    $scope.dataIsLoaded.Things = undefined
    $scope.dataIsLoaded.obs = undefined


    $scope.selectedDatastreams = {}
    $scope.selectedDatastreamIds = []
    $scope.selectedTimeframe = {}  

    /*
    //select for table manipulation. NOT transported into query
    $scope.selectparams = {}
    $scope.selectparams.obs = {}
    $scope.selectparams.Datastreams = {}
    $scope.selectparams.Things = {}
    */

    //expand parameters. ARE transported into the query
    $scope.expandparams = {}
    $scope.expandparams.obs = {} // ?
    $scope.expandparams.Things = {}

    
    $scope.filterparameter = {}


    $scope.linkClicked = function (type, id) {

        //$location.url($location.path());
        $location.search({});
        $scope.Page.go(type + "/" + id);
    };






    // --------------------------------------------------------------------------
    // -------------------------- Patch and Post Logic --------------------------
    // --------------------------------------------------------------------------


    $scope.deletekey = function(key,obj){delete obj[key]};
    $scope.isTrueObject = function(obj){return(typeof(obj) ==='object' && obj!==null && !Array.isArray(obj))}


    //function that reads ordinary json into the tree structure. 
    $scope.traverse = function(obj,target,toplevel=true){

        Object.keys(obj).forEach(function(key){
            var item = {}
            item["key"] = key
            if(toplevel){item["@toplevelcheck"]=true} //at first function call, add an extra key to toplevel to identify in view logic

            if($scope.isTrueObject(obj[key])){ // --> object value is json
                item["value"] = {}
                item["items"] = []
                target.push(item)
                $scope.traverse(obj[key],item["items"],false)           
            } else if(Array.isArray(obj[key]) && $scope.isTrueObject(obj[key][0])){ // --> object value is an array & zeroeth element of array is json -> assume array of objects and traverse
                
                item["value"] = "@objectIsArray"
                item["items"] = []
                target.push(item)
                $scope.traverse(obj[key],item["items"],false)   

            } else { // --> object value is simple value or an array with simple entries (no json entries)
                item["value"] = obj[key]
                item["items"] = []
                target.push(item)
            };

        });
    };


    //function that reads a tree and converts it to a json object. 
    $scope.esrevart = function(tree,target,listname="items"){
        tree.forEach(function(entry){
            if(entry[listname].length == 0){ //if item encodes a "normal" key value pair ({key: some key, value: some value, items: []} --> {some key: some value})
                target[entry.key] = entry.value
            } else if (entry.value === "@objectIsArray") { //if item encodes an array as json value ({key: some key, value: @objectIsArray, items: [ -list of json objects- ]} --> {some key: [ -list of json objects- ]})
                target[entry.key] = []
                entry[listname].forEach(function(element, index){
                    let ephtarget = {}
                    $scope.esrevart(element[listname],ephtarget)
                    target[entry.key].push(ephtarget)
                });

            } else { //if the item encodes another json object as its value ({key: some key, value: -is ignored-, items: [ -list of json objects- ]} --> {some key: { -list of json objects as object instead of array- }})
                target[entry.key] = {}
                $scope.esrevart(entry[listname],target[entry.key],listname)
            }
        });
    };
    


    // ---------------- functions to call for patching and posting ----------------
    $scope.jsonPatchRequest = function(entity){
        $scope.jsonobj = entity
        $scope.patchRequest($scope.jsonobj)
    };

    //add function that adds top level name descirption etc changes before patching --> not in item items so far!
    $scope.treePatchRequest = function(entity){
        $scope.jsonobj = {}
        $scope.esrevart(entity,$scope.jsonobj)  //convert angularjs readable format back to ordinary json for patching
        console.log($scope.jsonobj)
        $scope.patchRequest($scope.jsonobj)

    };
    // -----------------------------------------------------------------------------


    //password check: checks pw given by user, styles the input field as feedback to user and returns true/false if pw was correct/incorrect
    $scope.checkPWcontainer = function(){
        if(sha1.hex($scope.pwUserInput) == patchhash){

            $scope.pwvalid = "PASSWORD CORRECT";
            Array.from(document.getElementsByClassName('patchpwcontainer')).forEach(element => {
                element.classList.add("text-success")
                element.classList.remove("text-danger")
            });

            return true

        } else {
            $scope.pwvalid = "PASSWORD INCORRECT";
            Array.from(document.getElementsByClassName('patchpwcontainer')).forEach(element => {
                element.classList.add("text-danger")
                element.classList.remove("text-success")
            });
            alert("PASSWORD INCORRECT")
            $scope.pwUserInput = ''

            return false
        };

    };


    $scope.patchRequest = function(entity){        
        if($scope.checkPWcontainer()){

            var patchtargetadress = entity["@iot.selfLink"]
            Object.keys(entity).forEach(function(key){  //drop all keys with @iot as they are immutable such as id, crosslinks etc
                if(key.includes('@iot')){
                    $scope.deletekey(key,entity)
                }     
            });

            $http.patch(patchtargetadress,JSON.stringify(entity),patchhconfig).then(function (response) {
                alert("Patch Request Response: " + response.status + "\n" + response.statusText)
            });
        };
    };






    $scope.directPostRequest = function(entity, adress){

        if(sha1.hex($scope.pwUserInput) == patchhash){
            $scope.pwvalid = "PASSWORD CORRECT";
            document.getElementById('patchpwcontainer').classList.add("text-success");
            document.getElementById('patchpwcontainer').classList.remove("text-danger");

            $scope.postEntity(entity,adress)
        
        } else {
            $scope.pwvalid = "PASSWORD INCORRECT";
            document.getElementById('patchpwcontainer').classList.add("text-danger");
            document.getElementById('patchpwcontainer').classList.remove("text-success");
            alert("PASSWORD INCORRECT")
            $scope.pwUserInput = ''
        }
    };


    $scope.postEntity = function(entity,adress){

        console.log("----- POSTING -----")
        console.log("target adress: " + adress)
        console.log("DATA SENT FOR POSTING: ")
        console.log(entity)

        $http.post(adress,JSON.stringify(entity)).then(function (response) {
            console.log("response code: " + response.status)
            $http.get(adress).then(function (response) {
                console.log("NEW DATA: ")
                console.log(response.data)
                console.log("----- END POSTING ----")
                alert("Post Request Response: " + response.status + "\n" + response.statusText)
            })
        });
    };

    
    $scope.consoleLog = function(entity){
        console.log(entity)
    };


    //Browser check from https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser

    $scope.browserCheck = function(){
        // Opera 8.0+
        var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

        // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';

        // Safari 3.0+ "[object HTMLElementConstructor]" 
        var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

        // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;

        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;

        // Chrome 1 - 79
        var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

        // Edge (based on chromium) detection
        var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

        // Blink engine detection
        var isBlink = (isChrome || isOpera) && !!window.CSS;


        if(isIE){
            alert("You are using an outdated Browser. Parts of the Website may not function properly.")
        }

    };
    $scope.browserCheck();
});