const { WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { PROTECTION_ORDER_DIALOG } = require('../models/dialogIdConstants');
const PROTECTION_ORDER_WATERFALL_DIALOG = 'PROTECTION_ORDER_WATERFALL_DIALOG';

class ProtectionOrderDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || PROTECTION_ORDER_DIALOG);

        this.addDialog(new WaterfallDialog(PROTECTION_ORDER_WATERFALL_DIALOG, [
            this.introStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = PROTECTION_ORDER_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        const protectionOrderGuideline = {
            type: 'message',
            text: 'These are the steps to follow when applying for a Protection Order.',
            attachments: [
                {
                    contentType: 'image/jpg',
                    contentUrl: 'https://iwitney8f56z.blob.core.windows.net/ngodata/Protection%20order%20procedures.jpg'
                }
            ]
        };

        await stepContext.context.sendActivity(protectionOrderGuideline);

        const protectionOrderForm = {
            type: 'message',
            text: 'This is a protection order form.',
            attachments: [
                {
                    contentType: 'application/pdf',
                    contentUrl: 'https://iwitney8f56z.blob.core.windows.net/ngodata/protection_order_application.pdf'
                }
            ]
        };

        return await stepContext.context.sendActivity(protectionOrderForm);
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.ProtectionOrderDialog = ProtectionOrderDialog;
