const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { TextPrompt, WaterfallDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const {
    TEXT_PROMPT,
    EMERGENCY_DIALOG,
    RETRIEVE_EVIDENCE_DIALOG,
    CALL_POLICE_DIALOG,
    CAPTURE_EVIDENCE_DIALOG,
    MAIN_MENU_DIALOG,
    OTHER_HELP_DIALOG
} = require('../models/dialogIdConstants');
const MAIN_MENU_WATERFALL_DIALOG = 'MAIN_MENU_WATERFALL_DIALOG';

class MainMenuDialog extends CancelAndHelpDialog {
    constructor(luisRecognizer, emergencyDialog, captureEvidenceDialog, retrieveEvidenceDialog, callPoliceDialog, otherHelpDialog) {
        super(MAIN_MENU_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        if (!emergencyDialog) throw new Error('[MainDialog]: Missing parameter \'emergencyDialog\' is required');
        if (!captureEvidenceDialog) throw new Error('[MainDialog]: Missing parameter \'captureEvidenceDialog\' is required');
        if (!retrieveEvidenceDialog) throw new Error('[MainDialog]: Missing parameter \'retrieveEvidenceDialog\' is required');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(emergencyDialog)
            .addDialog(captureEvidenceDialog)
            .addDialog(retrieveEvidenceDialog)
            .addDialog(callPoliceDialog)
            .addDialog(otherHelpDialog)
            .addDialog(new WaterfallDialog(MAIN_MENU_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_MENU_WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            console.log(messageText);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Hi I am the *IWitness Bot 🤖*.' +
            '\nWhich of the below can i assist you with today?' +
            '\n\n1. Emergency 🚨' +
            '\n2. Capture Evidence 📸' +
            '\n3. Retrieve Evidence 🔬' +
            '\n4. Help and Support Services 🩺';

        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const response = {};

        if (!this.luisRecognizer.isConfigured) {
            console.log('LUIS is not configured, we just run the BookingDialog path');
            return await stepContext.beginDialog(EMERGENCY_DIALOG, response);
        }

        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'Greeting': {
            return await stepContext.beginDialog(MAIN_MENU_WATERFALL_DIALOG);
        }

        case 'Emergency': {
            return await stepContext.beginDialog(EMERGENCY_DIALOG);
        }

        case 'CaptureEvidence': {
            return await stepContext.beginDialog(CAPTURE_EVIDENCE_DIALOG);
        }

        case 'CallPolice': {
            return await stepContext.beginDialog(CALL_POLICE_DIALOG);
        }

        case 'RetrieveEvidence': {
            return await stepContext.beginDialog(RETRIEVE_EVIDENCE_DIALOG);
        }

        case 'NumberOption': {
            switch (stepContext.result) {
            case '1':
            case 'one':
                return await stepContext.beginDialog(EMERGENCY_DIALOG);
            case '2':
            case 'two':
                return await stepContext.beginDialog(CAPTURE_EVIDENCE_DIALOG);
            case '3':
            case 'three':
                return await stepContext.beginDialog(RETRIEVE_EVIDENCE_DIALOG);
            case '4':
            case 'four':
                return await stepContext.beginDialog(OTHER_HELP_DIALOG);

            default: {
                const didntUnderstandMessageText = `☹️ Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })
                \n\nThe IWitness Team is currently working on making me better`;
                return await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            }
            }
        }

        default: {
            const didntUnderstandMessageText = `☹️ Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })
                \n\nThe IWitness Team is currently working on making me better`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "delete conversation" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        if (stepContext.result) {
            const msg = 'For your safety please clear the above conversation.';
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        } else if (LuisRecognizer.topIntent(luisResult) === 'Cancel') {
            const msg = 'Thank you for using our service.';
            return await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        return await stepContext.replaceDialog(this.initialDialogId, {
            restartMsg: 'What else can I do for you?' +
                '\n\n1. Emergency 🚨' +
                '\n2. Capture Evidence 📸' +
                '\n3. Retrieve Evidence 🔬' +
                '\n4. Help and Support Services 🩺'
        });
    }
}

module.exports.MainMenuDialog = MainMenuDialog;
