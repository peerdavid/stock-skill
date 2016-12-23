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
            stockValue = this.getStockInformation(stockSlot.value);
            // tellWithCard(speechOutput, cardTitle, cardContent)
            var speechOutput = "Die " + stockSlot.value + " aktie steht bei " + stockValue;
            var cardTitle = stockSlot.value + " Stock";
            var cardContent = stockValue;
            response.tellWithCard(speechOutput, cardTitle, cardContent);
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


Broker.prototype.getStockInformation = function (stock) {
    if(stock === "microsoft"){
        return "54$";
    } else if (stock === "google"){
        return "100$"
    }
    
    return "34 $";
}


// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var helloWorld = new Broker();
    helloWorld.execute(event, context);
};