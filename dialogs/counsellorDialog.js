const { WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { COUNSELLOR_DIALOG } = require('../models/dialogIdConstants');
const COUNSELLOR_WATERFALL_DIALOG = 'COUNSELLOR_WATERFALL_DIALOG';

class CounsellorDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || COUNSELLOR_DIALOG);

        this.addDialog(new WaterfallDialog(COUNSELLOR_WATERFALL_DIALOG, [
            this.introStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = COUNSELLOR_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.context.sendActivity('Please dial 021 465 7373 for The Trauma Centre');
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.CounsellorDialog = CounsellorDialog;
