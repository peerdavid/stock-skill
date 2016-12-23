/**
 *  Broker skill for amazon Alexa
 * 
 * Author: Peer David
 * Date: 23.12.2016
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
    var repromptText = "Frage nach einem Aktienkurs.";
    response.ask(speechOutput, repromptText);
};


Broker.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


Broker.prototype.intentHandlers = {
    // register custom intent handlers
    "BrokerIntent": function (intent, session, response) {

        var stockSlot = intent.slots.Stock;

        if(stockSlot && stockSlot.value){
            this.handleStockValue(response, stockSlot.value);
        } else {
            var speechOutput = "Frage nach einem Aktienkurs.";
            var repromptText = "Frage nach einem Aktienkurs.";
            response.ask(speechOutput, repromptText);
        }
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    }
};


Broker.prototype.handleStockValue = function (response, stockName) {
    var onError = function(err){
        response.tell("Ich konnte keine Informationen zu " + stockName + " finden.");
    };

    var self = this;
    self.lookupSymbol(stockName, function(symbols){
        var stockSymbol = symbols[0].Symbol; // ToDo: Aks which code, if there are more than one

        self.lookupStockInfos(stockSymbol, function(stockInfos) {
            var speechOutput = "Der Kurs der Aktie " + stockInfos.Name + " liegt bei " + stockInfos.LastPrice;
            var cardTitle = "Aktie " + stockInfos.Name;
            var cardContent = "Value = " + stockInfos.LastPrice;
            response.tellWithCard(speechOutput, cardTitle, cardContent);
        }, onError);
    }, onError);
}


Broker.prototype.lookupSymbol = function(stockName, onResult, onError){
    var url = "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" + stockName;
    console.log("Reading smybol for stock name | Url: " + url);

    http.get(url, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var symbols = JSON.parse(body);
            console.log("Got symbol(s) | ", body);
            onResult(symbols);
        });
    }).on('error', function(e){
        console.log("Error reading symbols | ", e);
        onError(e);
    });
}


Broker.prototype.lookupStockInfos = function(stockSymbol, onResult, onError){
    var url = "http://dev.markitondemand.com/MODApis/Api/v2/Quote/json?symbol=" + stockSymbol;
    console.log("Reading stock value for symbol | Url: " + url);

    http.get(url, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var stockInfos = JSON.parse(body);
            console.log("Got stock infos | ", body);
            onResult(stockInfos);
        });
    }).on('error', function(e){
        console.log("Error reading stock infos | ", e);
        onError(e);
    });
}


/**
 * Create the handler that responds to the Alexa Request.
 */
exports.handler = function (event, context) {
    var broker = new Broker();
    broker.execute(event, context);
};