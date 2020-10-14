const { ConfirmPrompt, TextPrompt, WaterfallDialog, AttachmentPrompt } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const CAPTURE_WATERFALL_DIALOG = 'CAPTURE_WATERFALL_DIALOG';
const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';

class CaptureDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'CAPTURE_WATERFALL_DIALOG');
        this.evidence = [];
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.evidencePromptValidator))
            .addDialog(new WaterfallDialog(CAPTURE_WATERFALL_DIALOG, [
                this.captureStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CAPTURE_WATERFALL_DIALOG;
    }

    async captureStep(stepContext) {
        const promptOptions = {
            prompt: 'Please attach evidence (or type any message to skip).',
            retryPrompt: 'The attachment must be a media file.'
        };

        return await stepContext.prompt(ATTACHMENT_PROMPT, promptOptions);
    }

    async confirmStep(stepContext) {
        const evidence = stepContext.options;
        if (evidence.data) {
            evidence.data = evidence.data.concat(stepContext.result);
        } else {
            evidence.data = stepContext.result;
        }

        return await stepContext.prompt(CONFIRM_PROMPT, 'Would you like to capture more items?\n\n', ['yes', 'no']);
    }

    async finalStep(stepContext) {
        const evidence = stepContext.options;
        if (stepContext.result) {
            return await stepContext.replaceDialog(CAPTURE_WATERFALL_DIALOG, evidence);
        }
        return await stepContext.endDialog(evidence.data);
    }

    async evidencePromptValidator(promptContext) {
        const supportedContentTypes = ['audio/basic', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
            'audio/L24', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/vorbis', 'audio/vnd.rn-realaudio',
            'audio/vnd.wave', 'audio/3gpp', 'audio/3gpp2', 'audio/ac3', 'audio/vnd.wave', 'audio/webm',
            'audio/amr-nb', 'audio/amr', 'video/mpeg', 'video/mp4', 'video/quicktime', 'video/webm',
            'video/3gpp', 'video/3gpp2', 'video/3gpp-tt', 'video/H261', 'video/H263', 'video/H263-1998',
            'video/H263-2000', 'video/H264', 'application/json'
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

            return !!validEvidence.length;
        } else {
            await promptContext.context.sendActivity('No attachments received. Proceeding without capturing evidence...');
            return true;
        }
    }
}

module.exports.CaptureDialog = CaptureDialog;
