const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { LuisRecognizer } = require('botbuilder-ai');
const { InputHints } = require('botbuilder');
const { CONFIRM_PROMPT, TEXT_PROMPT, OTHER_HELP_DIALOG, CALL_POLICE_DIALOG } = require('../models/dialogIdConstants');
const EMERGENCY_WATERFALL_DIALOG = 'EMERGENCY_WATERFALL_DIALOG';

class EmergencyDialog extends CancelAndHelpDialog {
    constructor(id, luisRecognizer, otherHelpDialog, callPoliceDialog) {
        super(id || 'EMERGENCY_DIALOG');
        this.luisRecognizer = luisRecognizer;
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(otherHelpDialog)
            .addDialog(callPoliceDialog)
            .addDialog(new WaterfallDialog(EMERGENCY_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = EMERGENCY_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'Should I call the Police or ask for other help?', ['police', 'other help']);
    }

    async actStep(stepContext) {
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'OtherHelp': {
            return await stepContext.beginDialog(OTHER_HELP_DIALOG);
        }

        case 'CallPolice': {
            return await stepContext.beginDialog(CALL_POLICE_DIALOG);
        }

        default: {
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })\n
             \n\n The IWitness Team is currently working on making me better`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.EmergencyDialog = EmergencyDialog;
