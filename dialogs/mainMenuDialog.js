// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainMenuDialog extends CancelAndHelpDialog {
    constructor(luisRecognizer, emergencyDialog, captureEvidenceDialog, retrieveEvidenceDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!emergencyDialog) throw new Error('[MainDialog]: Missing parameter \'emergencyDialog\' is required');
        if (!captureEvidenceDialog) throw new Error('[MainDialog]: Missing parameter \'captureEvidenceDialog\' is required');
        if (!retrieveEvidenceDialog) throw new Error('[MainDialog]: Missing parameter \'retrieveEvidenceDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(emergencyDialog)
            .addDialog(captureEvidenceDialog)
            .addDialog(retrieveEvidenceDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Hi I am the IWitness Bot. ' +
            '\nWhat can I help you with today?' +
            '\n\nPlease select any one of the below options:"' +
            '\n1. Emergency' +
            '\n2. Capture Evidence' +
            '\n3. Retrieve Evidence';

        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const response = {};

        if (!this.luisRecognizer.isConfigured) {
            // LUIS is not configured, we just run the BookingDialog path.
            return await stepContext.beginDialog('bookingDialog', response);
        }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'Emergency':
        case '1': {
            // Extract the values for the composite entities from the LUIS result.
            const data = this.luisRecognizer.getFromEntities(luisResult);

            console.log('LUIS extracted this data and classified it under emergency:', JSON.stringify(data));

            // Run the emergencyDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('emergencyDialog', data);
        }

        case 'Capture Evidence ':
        case '2': {
            // Extract the values for the composite entities from the LUIS result.
            const data = this.luisRecognizer.getFromEntities(luisResult);

            console.log('LUIS extracted this data and classified it under capture evidence:', JSON.stringify(data));

            // Run the captureEvidenceDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('captureEvidenceDialog', data);
        }

        case 'Retrieve Evidence':
        case '3': {
            // Extract the values for the composite entities from the LUIS result.
            const data = this.luisRecognizer.getFromEntities(luisResult);

            console.log('LUIS extracted this data and classified it under retrieve evidence:', JSON.stringify(data));

            // Run the retrieveEvidenceDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('retrieveEvidenceDialog', data);
        }

        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })\n
             \n\n The IWitness Team is currently working on making me better`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        const msg = 'For your safety please clear the above conversation. \n\nHave an amazing day!';
        await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);

        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainMenuDialog = MainMenuDialog;
