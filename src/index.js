/**
 *  Broker skill for amazon Alexa 
 * 
 * Author: Peer David
 * Date: 23.12.2016
 * Note: Call "Alexa, öffne Aktienkurs"
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
    console.log("Broker onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};


Broker.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Broker onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    askForFirstStock(response);
};


Broker.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Broker onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


Broker.prototype.intentHandlers = {
    "GetFirstSockIntent": function (intent, session, response) {

        var stockSlot = intent.slots.Stock;

        if(stockSlot && stockSlot.value){
            // Sometimes alexa hears I. B. M -> so we parse ALL of it before we use it...
            var stockName = stockSlot.value.toString().split(". ").join("");

            // We also remove all . -> it is not needed to find a stock via yahoo finance api
            stockName = stockName.split(".").join(" ");

            // Search for it now
            this.searchStockInfos(response, stockName);
        } else {
            askForFirstStock(response);
        }
    },

    "GetNextStockIntent": function (intent, session, response) {
        var speechOutput = "Welchen Aktienkurs möchtest du wissen?";
        var reprompText = "Welchen Aktienkurs möchtest du wissen?";
        response.ask(speechOutput, reprompText);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        askForFirstStock(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        response.tell("Servus und bis zum nächsten mal.");
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        response.tell("Servus und bis zum nächsten mal.");
    }
};


Broker.prototype.searchStockInfos = function (response, stockName) {
    var onError = function(err){
        response.tell("Ich konnte keine Informationen für " + stockName + " finden.");
    };

    var self = this;
    self.lookupSymbol(stockName, function(symbols){
        if(symbols.length <= 0){
            onError("No symbol found for stock " + stockName);
            return;
        }

        // Possible we have fonds etc.
        symbols = filterStockOnly(symbols);
        if(symbols.length <= 0){
            onError("No symbol found for stock " + stockName);
            return;
        }

        var exchPrefers = ["NASDAQ", "NYSE", "LSE", "Euronext", "XETRA", "Frankfurt", "Hamburg", "Stuttgart", "Wien", 
                           "Berlin", "Schweiz", "CME", "TSE", "AEX", "AMEX", "SSE", "CBOT"];
        var stockSymbol = findPreferedSymbol(symbols, exchPrefers);

        self.lookupStockInfos(stockSymbol.symbol, function(stockInfos) {
            // Return informations of stock
            var stockLastTradingPrice = convertToGermanNumber(stockInfos.LastTradePriceOnly);
            var stockCurrency = convertToGermanCurrency(stockInfos.Currency);
            var stockChange = stockInfos.PercentChange.replace(".", ",");

            var speechOutput = "Auf der Börse " + stockSymbol.exchDisp + "beträgt der Wert der " + stockSymbol.typeDisp + " " +
                                stockInfos.Name + " " + stockLastTradingPrice + " " + stockCurrency + " . \n" + 
                                "Die Veränderung der Aktie beträgt " + stockChange + ". \n";
            var cardTitle = stockSymbol.typeDisp + ": " + stockInfos.Name + "(" + stockSymbol.exchDisp + ")";
            var cardContent = stockLastTradingPrice + stockCurrency + " (" + stockChange + ") " + " am " + stockInfos.LastTradeDate + " um " + stockInfos.LastTradeTime;
            tellInfosAndAskForNextStock(response, speechOutput, cardTitle, cardContent);
        }, onError);
    }, onError);
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


function findPreferedSymbol (symbols, exchPrefers){
    for(var i = 0; i < exchPrefers.length; i++){
        for(var j=0; j < symbols.length; j++){
            if(exchPrefers[i].toLowerCase() == symbols[j].exchDisp.toLowerCase()){
                return symbols[j];
            }
        }
    }

    return symbols[0];
}


function filterStockOnly (symbols){
    var ret = []
    for(var i = 0; i < symbols.length; i++){
        if(symbols[i].typeDisp.toLowerCase() == "aktie"){
            ret.push(symbols[i]);
        }
    }

    return ret;
}


function convertToGermanNumber (num){
    return parseFloat(num).toFixed(2).toString().replace(".", ",");
}


function convertToGermanCurrency(currency){
    if(currency.toLowerCase() == "usd"){
        return "$";
    } else if(currency.toLowerCase() == "eur"){
        return " Euro";
    }

    return currency;
}


function askForFirstStock(response){
    var speechOutput = "Mit Aktienkurs kannst du Informationen zum aktuellen Kurs einer Aktie abfragen. Welche Aktie sollte ich für dich suchen?";
    var reprompText = "Welchen Aktienkurs möchtest du wissen?";
    response.ask(speechOutput, reprompText);
}


function tellInfosAndAskForNextStock(response, speechOutput, cardTitle, cardContent){
    var speechOutput = speechOutput + ".\n Möchtest du den Kurs einer weiteren Aktie wissen?";
    var reprompText = "Welchen Aktienkurs möchtest du wissen?";
    response.askWithCard(speechOutput, reprompText, cardTitle, cardContent);
}


/**
 * Create the handler that responds to the Alexa Request.
 */
exports.handler = function (event, context) {
    var broker = new Broker();
    broker.execute(event, context);
};