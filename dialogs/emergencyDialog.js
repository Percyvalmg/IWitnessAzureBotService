const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const EMERGENCY_WATERFALL_DIALOG = 'emergencyWaterfallDialog';

class EmergencyDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'emergencyDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(EMERGENCY_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = EMERGENCY_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        const msg = 'This is the emergency section';
        return await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.EmergencyDialog = EmergencyDialog;
