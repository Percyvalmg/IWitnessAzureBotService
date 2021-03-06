const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { User } = require('../models/user');
const { TEXT_PROMPT, AUTHENTICATION_DIALOG } = require('../models/dialogIdConstants');
const AUTHENTICATION_WATERFALL_DIALOG = 'AUTHENTICATION_WATERFALL_DIALOG';

class AuthenticationDialog extends CancelAndHelpDialog {
    constructor(id, databaseService) {
        super(id || AUTHENTICATION_DIALOG);
        this.databaseService = databaseService;
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(AUTHENTICATION_WATERFALL_DIALOG, [
                this.enterPasswordStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = AUTHENTICATION_WATERFALL_DIALOG;
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
            await stepContext.context.sendActivity('Your password is incorrect, please try again ☹️');
            return await stepContext.replaceDialog(AUTHENTICATION_DIALOG, false);
        }

        return await stepContext.endDialog(this.user);
    }
}

module.exports.AuthenticationDialog = AuthenticationDialog;
