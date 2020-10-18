const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, COUNSELLOR_DIALOG } = require('../models/dialogIdConstants');
const COUNSELLOR_WATERFALL_DIALOG = 'COUNSELLOR_WATERFALL_DIALOG';

class CounsellorDialog extends CancelAndHelpDialog {
    constructor(id, counsellorDialog) {
        super(id || COUNSELLOR_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            // .addDialog(callPoliceOnBehalfOfDialog)
            .addDialog(new WaterfallDialog(CALL_POLICE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                // this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CALL_POLICE_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'Please dial 021 465 7373 for The Trauma Centre' );
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.CounsellorDialog = CounsellorDialog;
