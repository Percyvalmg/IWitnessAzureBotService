const { InputHints } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { LuisRecognizer } = require('botbuilder-ai');
const { COUNSELLOR_DIALOG, TEXT_PROMPT, OTHER_HELP_DIALOG, PLACE_OF_SAFETY_DIALOG, PROTECTION_ORDER_DIALOG } = require('../models/dialogIdConstants');
const OTHER_HELP_WATERFALL_DIALOG = 'OTHER_HELP_WATERFALL_DIALOG';

class OtherHelpDialog extends CancelAndHelpDialog {
    constructor(id, luisRecognizer, protectionOrderDialog, placeOfSafetyDialog, counsellorDialog) {
        super(id || OTHER_HELP_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        if (!protectionOrderDialog) throw new Error('[MainDialog]: Missing parameter \'protectionOrderDialog\' is required');
        if (!placeOfSafetyDialog) throw new Error('[MainDialog]: Missing parameter \'placeOfSafetyDialog\' is required');
        if (!counsellorDialog) throw new Error('[MainDialog]: Missing parameter \'counsellorDialog\' is required');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(protectionOrderDialog)
            .addDialog(placeOfSafetyDialog)
            .addDialog(counsellorDialog)
            .addDialog(new WaterfallDialog(OTHER_HELP_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = OTHER_HELP_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : '\nWhat kind of help do you need?' +
            '\n1. Speak to a counsellor' +
            '\n2. Get the address for a place of safety' +
            '\n3. Get information on how to apply for a protection order';

        return await stepContext.prompt(TEXT_PROMPT, { prompt: messageText });
    }

    async actStep(stepContext) {
        const response = {};

        if (!this.luisRecognizer.isConfigured) {
            console.log('LUIS is not configured, we just run the BookingDialog path');
            return await stepContext.beginDialog(OTHER_HELP_WATERFALL_DIALOG, response);
        }
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);

        if (LuisRecognizer.topIntent(luisResult) === 'NumberOption') {
            switch (stepContext.result) {
            case '1':
            case 'one':
                return await stepContext.beginDialog(COUNSELLOR_DIALOG);
            case '2':
            case 'two':
                return await stepContext.beginDialog(PLACE_OF_SAFETY_DIALOG);
            case '3':
            case 'three':
                return await stepContext.beginDialog(PROTECTION_ORDER_DIALOG);
            default: {
                const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })
            \n\nThe IWitness Team is currently working on making me better`;
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            }
            }
        }

        return await stepContext.next();
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.OtherHelpDialog = OtherHelpDialog;
