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
        const msg = 'Calling for help - Please wait this may take a few minutes';
        return await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.OtherHelpDialog = OtherHelpDialog;
