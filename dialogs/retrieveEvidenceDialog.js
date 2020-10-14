const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, RETRIEVE_EVIDENCE_DIALOG } = require('../models/dialogIdConstants');
const RETRIEVE_EVIDENCE_WATERFALL_DIALOG = 'RETRIEVE_EVIDENCE_WATERFALL_DIALOG';

class RetrieveEvidenceDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || RETRIEVE_EVIDENCE_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(RETRIEVE_EVIDENCE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = RETRIEVE_EVIDENCE_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        const msg = 'This is the retrieve evidence section';
        return await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.RetrieveEvidenceDialog = RetrieveEvidenceDialog;
