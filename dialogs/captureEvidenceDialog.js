const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { v4: uuidv4 } = require('uuid');
const { CONFIRM_PROMPT, TEXT_PROMPT, AUTHENTICATION_DIALOG, CAPTURE_DIALOG, CAPTURE_EVIDENCE_DIALOG } = require('../models/dialogIdConstants');

const CAPTURE_EVIDENCE_WATERFALL_DIALOG = 'CAPTURE_EVIDENCE_WATERFALL_DIALOG';

class CaptureEvidenceDialog extends CancelAndHelpDialog {
    constructor(id, authenticationDialog, captureDialog, databaseService) {
        super(id || CAPTURE_EVIDENCE_DIALOG);
        this.databaseService = databaseService;
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(authenticationDialog)
            .addDialog(captureDialog)
            .addDialog(new WaterfallDialog(CAPTURE_EVIDENCE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.statementStep.bind(this),
                this.termsAndConditionsStep.bind(this),
                this.confirmTermsAndConditionsStep.bind(this),
                this.captureStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CAPTURE_EVIDENCE_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to give a statement of what happened before you capture your evidence?\n\n', ['yes', 'no']);
    }

    async statementStep(stepContext) {
        if (stepContext.result) {
            const promptOptions = { prompt: 'Please give a brief description of what happened.' };
            return await stepContext.prompt(TEXT_PROMPT, promptOptions);
        } else {
            return await stepContext.next('No statement given');
        }
    }

    async termsAndConditionsStep(stepContext) {
        const statement = stepContext.options;
        statement.text = stepContext.result;

        const msg = statement.text === 'No statement given' ? 'No statement given' : `I have your statement as: \n\n *"${ statement.text }"*.`;
        await stepContext.context.sendActivity(msg);

        const termsAndConditions = {
            type: 'message',
            text: 'In order for us to capture you data, \nyou need to read and accept the *terms and conditions* in the attached image',
            attachments: [
                {
                    contentType: 'image/png',
                    contentUrl: 'http://cdn.thelayer.com/layersystems-public/eetcs.png'
                }
            ]
        };

        return await stepContext.prompt(CONFIRM_PROMPT, termsAndConditions, ['yes', 'no']);
    }

    async confirmTermsAndConditionsStep(stepContext) {
        if (stepContext.result) {
            return await stepContext.beginDialog(AUTHENTICATION_DIALOG, stepContext.result);
        }

        return await stepContext.endDialog();
    }

    async captureStep(stepContext) {
        this.user = stepContext.result;
        return await stepContext.beginDialog(CAPTURE_DIALOG);
    }

    async confirmStep(stepContext) {
        const statement = stepContext.options;
        statement.evidence = stepContext.result;

        if (statement.evidence) {
            const messageText = `😉 Thank you we have received ${ statement.evidence.length } item(s). \n\nShould we continue to store them?`;
            return await stepContext.prompt(CONFIRM_PROMPT, messageText);
        } else {
            return await stepContext.next();
        }
    }

    async finalStep(stepContext) {
        if (stepContext.result === true) {
            await stepContext.context.sendActivity('Your items have been captured ✅');
            const statement = stepContext.options;
            statement.id = stepContext.parent.context.activity.from.id;
            statement.date = Date.now();

            const id = uuidv4();
            this.user.statements.push(id);
            await this.databaseService.writeToDatabase({
                [id]: { statement: statement },
                [stepContext.parent.context.activity.from.id]: { user: this.user }
            });

            return await stepContext.endDialog(statement);
        } else {
            await stepContext.context.sendActivity('The items you sent us have not been captured.');
            return await stepContext.endDialog();
        }
    }
}

module.exports.CaptureEvidenceDialog = CaptureEvidenceDialog;
