const { ChoicePrompt, ConfirmPrompt, TextPrompt, WaterfallDialog, AttachmentPrompt } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const CAPTURE_EVIDENCE_WATERFALL_DIALOG = 'captureEvidenceWaterfallDialog';

class CaptureEvidenceDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'captureEvidenceDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.evidencePromptValidator))
            .addDialog(new WaterfallDialog(CAPTURE_EVIDENCE_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.statementStep.bind(this),
                this.captureStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CAPTURE_EVIDENCE_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to give a statement of what happened before you capture your evidence?', ['yes', 'no']);
    }

    async statementStep(stepContext) {
        if (stepContext.result) {
            const promptOptions = { prompt: 'Please give a brief description of what happened.' };
            return await stepContext.prompt(TEXT_PROMPT, promptOptions);
        } else {
            return await stepContext.next('No statement given');
        }
    }

    async captureStep(stepContext) {
        const statement = stepContext.options;
        statement.text = stepContext.result;

        const msg = statement.text === 'No statement given' ? 'No statement given' : `I have your statement as: \n\n "${ statement.text }".`;
        // We can send messages to the user at any point in the WaterfallStep.
        await stepContext.context.sendActivity(msg);

        const promptOptions = {
            prompt: 'Please attach evidence (or type any message to skip).',
            retryPrompt: 'The attachment must be a jpeg/png image file.'
        };
        return await stepContext.prompt(ATTACHMENT_PROMPT, promptOptions);
    }

    async confirmStep(stepContext) {
        const statement = stepContext.options;
        statement.evidence = stepContext.result;

        if (statement.evidence) {
            const messageText = `Thank you we have received ${ statement.evidence.length } items. \nShould we continue to store them?`;
            return await stepContext.prompt(CONFIRM_PROMPT, messageText);
        } else {
            return await stepContext.next();
        }
    }

    async finalStep(stepContext) {
        if (stepContext.result === true) {
            await stepContext.context.sendActivity('Your items have been captured');
            const statement = stepContext.options;
            return await stepContext.endDialog(statement);
        }

        return await stepContext.endDialog();
    }

    async evidencePromptValidator(promptContext) {
        const supportedContentTypes = ['audio/basic', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
            'audio/L24', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/vorbis', 'audio/vnd.rn-realaudio',
            'audio/vnd.wave', 'audio/3gpp', 'audio/3gpp2', 'audio/ac3', 'audio/vnd.wave', 'audio/webm',
            'audio/amr-nb', 'audio/amr', 'video/mpeg', 'video/mp4', 'video/quicktime', 'video/webm',
            'video/3gpp', 'video/3gpp2', 'video/3gpp-tt', 'video/H261', 'video/H263', 'video/H263-1998',
            'video/H263-2000', 'video/H264'
        ];

        if (promptContext.recognized.succeeded) {
            const attachments = promptContext.recognized.value;
            const validEvidence = [];

            attachments.forEach(attachment => {
                if (supportedContentTypes.includes(attachment.contentType)) {
                    validEvidence.push(attachment);
                }
            });

            promptContext.recognized.value = validEvidence;

            // If none of the attachments are valid images, the retry prompt should be sent.
            return !!validEvidence.length;
        } else {
            await promptContext.context.sendActivity('No attachments received. Proceeding without capturing evidence...');
            return true;
        }
    }
}

module.exports.CaptureEvidenceDialog = CaptureEvidenceDialog;
