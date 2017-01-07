# Stock skill for alexa (german)
With this skill you can ask alexa for current stock prices of different markets.

## HowTo use this skill
Alexa, öffne Aktienkurs.<br />
<i>Welche Aktie sollte ich für dich suchen?</i><br />
Amazon.<br />
<i>Der Wert der Aktie Amazon beträgt auf der Börse ...</i><br />
<br />
Alexa, frage Aktienkurs nach Amazon.<br />
<i>Der Wert der Aktie Amazon beträgt auf der Börse ...</i><br />

## HowTo setup the skill and the lambda function
1. Register as a developer on amazon aws.
2. Create a new lambda function (type = NodeJS)
3. Upload deploy.zip to your lambda function (build with deploy.sh if you change anything)
4. Create a new Alexa Skill (Type = Custom)
5. Set an Invocation Name (To use it in the same way as the example above, set it to "Wetterstation Zeus")
6. Copy IntentSchema.json, SlotType.txt and Utterances.txt and paste it into the Interaction Model.
7. Set the AWS Lambda ARN (AwsConsole/Lambda/Functions/<YourFunctionName> -> Right upper corner)
8. Finished
