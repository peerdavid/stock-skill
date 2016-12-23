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
    console.log("Broker onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};


Broker.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Broker onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    response.tell("Frage den broker nach einem Aktien kurs.");
};


Broker.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Broker onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


Broker.prototype.intentHandlers = {
    "BrokerIntent": function (intent, session, response) {

        var stockSlot = intent.slots.Stock;

        if(stockSlot && stockSlot.value){
            // Sometimes alexa hears I. B. M -> so we parse ALL of it before we use it...
            var stockName = stockSlot.value.toString().split(". ").join("");

            // We also remove all . -> it is not needed to find a stock
            stockName = stockName.split(".").join(" ");

            // Search for it now
            this.handleStockValue(response, stockName);
        } else {
            response.tell("Frage nach einem Aktienkurs.");
        }
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.tell("Frage den broker nach einem Aktien kurs.");
    }
};


Broker.prototype.handleStockValue = function (response, stockName) {
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
        symbols = self.filterStockOnly(symbols);
        if(symbols.length <= 0){
            onError("No symbol found for stock " + stockName);
            return;
        }

        var exchPrefers = ["NASDAQ", "NYSE", "LSE", "Euronext", "XETRA", "Frankfurt", "Hamburg", "Stuttgart", "Wien", 
                           "Berlin", "Schweiz", "CME", "TSE", "AEX", "AMEX", "SSE", "CBOT"];
        var stockSymbol = self.findPreferedSymbol(symbols, exchPrefers);

        self.lookupStockInfos(stockSymbol.symbol, function(stockInfos) {
            if(stockInfos.Bid == null){
                 var speechOutput = "Der letzte trading Wert der " + stockSymbol.typeDisp + " " + stockInfos.Name +
                                    " vom " + stockInfos.LastTradeDate + " um " + stockInfos.LastTradeTime + 
                                    " beträgt auf der Börse " + stockSymbol.exchDisp +
                                    stockInfos.LastTradePriceOnly + " " + stockCurrency + " . \n";
                
                var cardTitle = "Aktie: " + stockInfos.Name + "(" + stockSymbol.exchDisp + ") am " + 
                                stockInfos.LastTradeDate + " um " + stockInfos.LastTradeTime;
                var cardContent = stockInfos.LastTradePriceOnly + " " + stockCurrency;
                response.tellWithCard(speechOutput, cardTitle, cardContent);
            }

            // Return bid information
            var stockBid = self.convertToGermanNumber(stockInfos.Bid);
            var stockCurrency = self.convertToGermanCurrency(stockInfos.Currency);
            var speechOutput = "Auf der Börse " + stockSymbol.exchDisp + "beträgt der Wert der " + stockSymbol.typeDisp + " " 
                                + stockInfos.Name + " " + stockBid + " " + stockCurrency + " . \n";
            var cardTitle = "Aktie: " + stockInfos.Name + "(" + stockSymbol.exchDisp + ") am " + 
                            stockInfos.LastTradeDate + " um " + stockInfos.LastTradeTime;
            var cardContent = stockBid + " " + stockInfos.Currency;

            response.tellWithCard(speechOutput, cardTitle, cardContent);
        }, onError);
    }, onError);
}


Broker.prototype.findPreferedSymbol = function(symbols, exchPrefers){
    for(var i = 0; i < exchPrefers.length; i++){
        for(var j=0; j < symbols.length; j++){
            if(exchPrefers[i].toLowerCase() == symbols[j].exchDisp.toLowerCase()){
                return symbols[j];
            }
        }
    }

    return symbols[0];
}


Broker.prototype.filterStockOnly = function(symbols){
    var ret = []
    for(var i = 0; i < symbols.length; i++){
        if(symbols[i].typeDisp.toLowerCase() == "aktie"){
            ret.push(symbols[i]);
        }
    }

    return ret;
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
    return parseFloat(num).toFixed(2).toString().replace(".", ",");
}


Broker.prototype.convertToGermanCurrency = function(currency){
    if(currency.toLowerCase() == "usd"){
        return "$";
    } else if(currency.toLowerCase() == "eur"){
        return " Euro";
    }

    return currency;
}


/**
 * Create the handler that responds to the Alexa Request.
 */
exports.handler = function (event, context) {
    var broker = new Broker();
    broker.execute(event, context);
};