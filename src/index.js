/**
 *  Broker skill for amazon Alexa
 * 
 * Author: Peer David
 * Date: 23.12.2016
 * 
 * Note: To download names of companies by industry:
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.f3acff9f-f593-4793-9682-27b789533f6f";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var http = require('http');

/**
 * To read more about inheritance in JavaScript, see the link below.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Broker = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Broker.prototype = Object.create(AlexaSkill.prototype);
Broker.prototype.constructor = Broker;


Broker.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};


Broker.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HelloWorld onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Willkommen, dein Broker hilft der gerne weiter. Frage nach einem Aktienkurs.";
    response.tell(speechOutput);
};


Broker.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


Broker.prototype.intentHandlers = {
    "BrokerIntent": function (intent, session, response) {

        var stockSlot = intent.slots.Stock;

        if(stockSlot && stockSlot.value){
            this.handleStockValue(response, stockSlot.value);
        } else {
            response.tell("Frage nach einem Aktienkurs.");
        }
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.tell("Frage nach einem Aktienkurs.");
    }
};


Broker.prototype.handleStockValue = function (response, stockName) {
    var onError = function(err){
        response.tell("Ich konnte keine Informationen zu " + stockName + " finden.");
    };

    var self = this;
    self.lookupSymbol(stockName, function(symbols){
        if(symbols.length <= 0){
            response.tell("Ich konnte die aktie " + stockName + " nicht finden.")
            return;
        }

        var exchPrefers = ["NASDAQ", "NYSE", "TSE", "AEX", "Frankfurt"];
        var stockSymbol = self.findPreferedSymbol(symbols, exchPrefers);

        self.lookupStockInfos(stockSymbol.symbol, function(stockInfos) {
            var speechOutput = "Auf der Börse " + stockSymbol.exchDisp + "beträgt der Wert der Aktie " + stockInfos.Name + 
                               " " + self.convertToGermanNumber(stockInfos.Bid) + " " + stockInfos.Currency + " . \n";

            var cardTitle = "Aktie " + stockInfos.Name + "(" + stockSymbol.exchDisp + ")";
            var cardContent = self.convertToGermanNumber(stockInfos.Bid);
            response.tellWithCard(speechOutput, cardTitle, cardContent);
        }, onError);
    }, onError);
}


Broker.prototype.findPreferedSymbol = function(symbols, exchPrefers){
    for(var i = 0; i < exchPrefers.length; i++){
        for(var j=0; j < symbols.length; j++){
            if(exchPrefers[i] == symbols[j].exchDisp){
                return symbols[j];
            }
        }
    }

    return symbols[0];
}


Broker.prototype.lookupSymbol = function(stockName, onResult, onError){
    var url = "http://d.yimg.com/autoc.finance.yahoo.com/autoc?query=" + encodeURIComponent(stockName) + "&region=1&lang=de";
    console.log("Reading smybol for stock name | Url: " + url);

    http.get(url, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var symbols = JSON.parse(body);
            console.log("Got symbol(s) | ", body);
            onResult(symbols.ResultSet.Result);
        });
    }).on('error', function(e){
        console.log("Error reading symbols | ", e);
        onError(e);
    });
}


Broker.prototype.lookupStockInfos = function(stockSymbol, onResult, onError){
    var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + stockSymbol + "%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
    console.log("Reading stock value for symbol | Url: " + url);

    http.get(url, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var stockInfos = JSON.parse(body);
            console.log("Got stock infos | ", body);
            onResult(stockInfos.query.results.quote);
        });
    }).on('error', function(e){
        console.log("Error reading stock infos | ", e);
        onError(e);
    });
}


Broker.prototype.convertToGermanNumber = function(num){
    return num.toString().replace(".", ",");
}


/**
 * Create the handler that responds to the Alexa Request.
 */
exports.handler = function (event, context) {
    var broker = new Broker();
    broker.execute(event, context);
};