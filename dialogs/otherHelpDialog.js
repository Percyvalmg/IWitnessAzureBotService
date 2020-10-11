const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { LuisRecognizer } = require('botbuilder-ai');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const OTHERHELP_WATERFALL_DIALOG = 'otherHelpWaterfallDialog';

class OtherHelpDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'otherHelpDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(OTHERHELP_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = OTHERHELP_WATERFALL_DIALOG;
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
