const { WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { PLACE_OF_SAFETY_DIALOG } = require('../models/dialogIdConstants');
const PLACE_OF_SAFETY_WATERFALL_DIALOG = 'PLACE_OF_SAFETY_WATERFALL_DIALOG';

class PlaceOfSafetyDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || PLACE_OF_SAFETY_DIALOG);

        this.addDialog(new WaterfallDialog(PLACE_OF_SAFETY_WATERFALL_DIALOG, [
            this.introStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = PLACE_OF_SAFETY_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.context.sendActivity('Based on your location, this is the nearest place of safety:' +
            '\n *POWA Soweto*' +
            '\n *Room 10 Nthabiseng Centre, Chris Hani Hospital*' +
            '\n *Telephone: 011 933 2333/2310*'
        );
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.PlaceOfSafetyDialog = PlaceOfSafetyDialog;
