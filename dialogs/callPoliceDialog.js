const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, CALL_POLICE_DIALOG } = require('../models/dialogIdConstants');
const CALL_POLICE_WATERFALL_DIALOG = 'CALL_POLICE_WATERFALL_DIALOG';

class CallPoliceDialog extends CancelAndHelpDialog {
    constructor(id, callPoliceOnBehalfOfDialog) {
        super(id || CALL_POLICE_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(callPoliceOnBehalfOfDialog)
            .addDialog(new WaterfallDialog(CALL_POLICE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CALL_POLICE_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'Are you in a position to speak to the police or should we call the police on your behalf?' +
            '\n\n1. I will speak to the police.' +
            '\n2. Speak to the police on my behalf.' +
            '\n3. Cancel.');
    }

    async actStep(stepContext) {
        switch (stepContext.result) {
        case '1':
            return await stepContext.context.sendActivity('Call the Police on: \n10111');
        case '2':
            await stepContext.context.sendActivity('Before we call the Police we just have a few questions for you to answer...');
            return await stepContext.beginDialog('CALL_POLICE_On_BEHALF_OF_DIALOG');
        case '3':
            return stepContext.next();
        }
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.CallPoliceDialog = CallPoliceDialog;
