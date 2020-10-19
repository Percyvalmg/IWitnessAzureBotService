const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const moment = require('moment');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, AUTHENTICATION_DIALOG, RETRIEVAL_MENU_DIALOG, RETRIEVE_EVIDENCE_DIALOG } = require('../models/dialogIdConstants');

const WATERFALL_DIALOG = 'waterfallDialog';

class RetrieveEvidenceDialog extends CancelAndHelpDialog {
    constructor(id, authenticationDialog, retrievalMenuDialog ,) {
        super(id || RETRIEVE_EVIDENCE_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(authenticationDialog)
            .addDialog(retrievalMenuDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.authStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async authStep(stepContext) {
        return await stepContext.beginDialog(AUTHENTICATION_DIALOG, stepContext.result);
    }

    async finalStep(stepContext) {
        return await stepContext.beginDialog(RETRIEVAL_MENU_DIALOG, stepContext.result);
    }
}

module.exports.RetrieveEvidenceDialog = RetrieveEvidenceDialog;
