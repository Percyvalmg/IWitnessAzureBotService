const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, OTHER_HELP_DIALOG } = require('../models/dialogIdConstants');
const OTHER_HELP_WATERFALL_DIALOG = 'OTHER_HELP_WATERFALL_DIALOG';

class OtherHelpDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || OTHER_HELP_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(OTHER_HELP_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = OTHER_HELP_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'This is the Other Help section';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : '\nWhat kind of help do you need?'+
        '\n1. Speak to a counsellor'+
        '\n2. Get the address for a place of safety'+
        '\n3. Get information on how to apply for a protection order';
        

    const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
    return await stepContext.prompt(TEXT_PROMPT, { prompt: promptMessage });
}

async actStep(stepContext) {
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

    

    return await stepContext.next();
}

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.OtherHelpDialog = OtherHelpDialog;
