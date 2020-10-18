const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, PLACE_OF_SAFETY_DIALOG } = require('../models/dialogIdConstants');
const PLACE_OF_SAFETY_DIALOG = 'PLACE_OF_SAFETY_DIALOG';

class PlaceOfSafetyDialog extends CancelAndHelpDialog {
    constructor(id, placeOfSafetyDialog) {
        super(id || CALL_POLICE_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(placeOfSafetyDialog)
            .addDialog(new WaterfallDialog(PLACE_OF_SAFETY_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = PLACE_OF_SAFETY_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'Based on your location, this is the nearest place of safety:' +
        '\n POWA Soweto'+
        '\n Room 10 Nthabiseng Centre, Chris Hani Hospital'+
        '\n Telephone: 011 933 2333/2310'
        
            );
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog(stepContext.result);
    }
}

module.exports.PlaceOfSafetyDialog = PlaceOfSafetyDialog;
