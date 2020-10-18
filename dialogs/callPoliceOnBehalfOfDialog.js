const { AttachmentPrompt, ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const {
    CONFIRM_PROMPT,
    TEXT_PROMPT,
    CALL_POLICE_ON_BEHALF_OF_DIALOG,
    ATTACHMENT_PROMPT
} = require('../models/dialogIdConstants');
const CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG = 'CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG';

class CallPoliceOnBehalfOfDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || CALL_POLICE_ON_BEHALF_OF_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.locationPromptValidator))
            .addDialog(new WaterfallDialog(CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG, [
                this.getLocationStep.bind(this),
                this.getNameAndSurname.bind(this),
                this.confirmNameAndSurname.bind(this),
                this.getDescriptionOfSituation.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG;
    }

    async getLocationStep(stepContext) {
        if (stepContext.parent.context.activity.channelId === 'whatsapp') {
            const promptOptions = {
                prompt: 'Please send us your current location. (Not live location)',
                retryPrompt: 'The item you sent us was not a location.' +
                    '\n\nPlease send us your current location. (Not live location)'
            };

            return await stepContext.prompt(ATTACHMENT_PROMPT, promptOptions);
        }

        // TODO find a way to cater for location on web and facebook
        const promptOptions = {
            prompt: 'Please send us your current location.',
            retryPrompt: 'The item you sent us was not a location.' +
                '\n\nPlease send us your current location. (Not live location)'
        };

        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    async getNameAndSurname(stepContext) {
        const user = stepContext.options;
        user.location = stepContext.result;
        if (!user.location) {
            await stepContext.context.sendActivity('The item you sent us was not a location.');
            return await stepContext.replaceDialog(CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG);
        }
        return await stepContext.prompt(TEXT_PROMPT, 'Please give us your full name and surname');
    }

    async confirmNameAndSurname(stepContext) {
        const user = stepContext.options;
        user.name = stepContext.result;
        return await stepContext.prompt(CONFIRM_PROMPT, `We got: \n${ stepContext.result }\n\nIs that correct?\n\n`, ['Yes', 'No']);
    }

    async getDescriptionOfSituation(stepContext) {
        if (stepContext.result) {
            return await stepContext.prompt(TEXT_PROMPT, 'Final questions, please give us a brief description of what happened?');
        } else {
            return await stepContext.replaceDialog(CALL_POLICE_ON_BEHALF_OF_WATERFALL_DIALOG);
        }
    }

    async finalStep(stepContext) {
        const user = stepContext.options;
        user.description = stepContext.result;
        await stepContext.context.sendActivity('Thank you! ' +
            '\nWe have all the details we need. ' +
            '\nWe will be sending a message to you shortly to confirm that we have contacted the police.');

        return await stepContext.endDialog(user);
    }

    async locationPromptValidator(promptContext) {
        const supportedContentTypes = ['application/json'];
        if (promptContext.recognized.succeeded) {
            const attachments = promptContext.recognized.value;
            const validLocation = [];

            attachments.forEach(attachment => {
                if (supportedContentTypes.includes(attachment.contentType)) {
                    validLocation.push(attachment);
                }
            });

            promptContext.recognized.value = validLocation;
            return !!validLocation.length;
        } else {
            await promptContext.context.sendActivity('Please send appropriate location...');
            return false;
        }
    }
}

module.exports.CallPoliceOnBehalfOfDialog = CallPoliceOnBehalfOfDialog;
