const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const CALLPOLICE_WATERFALL_DIALOG = 'callpoliceWaterfallDialog';

class CallPoliceDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'callpoliceDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(CALLPOLICE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CALLPOLICE_WATERFALL_DIALOG;
    }


    async introStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT,'Police are on the Way\n'+'1. Call the police on your behalf\n'+'2. I will call the police\n',['1','2']);
    }

    async actStep(stepContext){
        if (stepContext.result) {
            const promptOptions = { prompt: 'Police are on the way' };
            return await stepContext.prompt(TEXT_PROMPT, promptOptions);
        } else {
            return await stepContext.next('Call the police on 10111');
        }
    }


    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.CallPoliceDialog = CallPoliceDialog;