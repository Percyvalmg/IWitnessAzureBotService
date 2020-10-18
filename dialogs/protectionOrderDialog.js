const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, PROTECTION_ORDER_DIALOG } = require('../models/dialogIdConstants');
const PROTECTION_ORDER_WATERFALL_DIALOG = 'PROTECTION_ORDER_WATERFALL_DIALOG';

class ProtectionOrderDialog extends CancelAndHelpDialog {
    constructor(id, protectionOrderDialog) {
        super(id || PROTECTION_ORDER_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(protectionOrderDialog)
            .addDialog(new WaterfallDialog(PROTECTION_ORDER_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = PROTECTION_ORDER_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'These are the steps to follow to apply for a Protection Order.' +
            );
    }

    const protectionOrder = {
        type:'message',
        text: 'These are the steps to follow to apply for a Protection Order.',
        attached image: [{
            contentType:'application/pdf'
            contentUrl:
        }]
    };
    return await stepContext.prompt(TEXT_PROMPT, protectionOrder)

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.ProtectionOrderDialog = ProtectionOrderDialog;
