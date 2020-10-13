const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { User } = require('../models/user');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const AUTHENTICATION_DIALOG = 'AUTHENTICATION_DIALOG';

class AuthenticationDialog extends CancelAndHelpDialog {
    constructor(id, databaseService) {
        super(id || 'AUTHENTICATION_DIALOG');
        this.databaseService = databaseService;
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(AUTHENTICATION_DIALOG, [
                this.enterPasswordStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = AUTHENTICATION_DIALOG;
    }

    async enterPasswordStep(stepContext) {
        if (stepContext.options) {
            this.user = await this.databaseService.getUser(stepContext.parent.context.activity.from.id);
            if (!this.user) {
                const promptOptions = { prompt: 'Please enter a safe word that you will use to later retrieve your data' };
                return await stepContext.prompt(TEXT_PROMPT, promptOptions);
            }
        }

        const promptOptions = { prompt: 'Please enter your safe word to continue' };
        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    async finalStep(stepContext) {
        if (!this.user) {
            this.user = new User(stepContext.parent.context.activity.from.id, stepContext.result);
        } else if (this.user.password !== stepContext.result) {
            await stepContext.context.sendActivity('Your password is incorrect, please try again');
            return await stepContext.replaceDialog(AUTHENTICATION_DIALOG, false);
        }

        return await stepContext.endDialog(this.user);
    }
}

module.exports.AuthenticationDialog = AuthenticationDialog;
