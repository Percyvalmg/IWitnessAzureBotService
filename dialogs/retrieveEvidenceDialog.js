const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const moment = require('moment');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CONFIRM_PROMPT, TEXT_PROMPT, AUTHENTICATION_DIALOG, RETRIEVE_EVIDENCE_DIALOG } = require('../models/dialogIdConstants');

const WATERFALL_DIALOG = 'waterfallDialog';

class RetrieveEvidenceDialog extends CancelAndHelpDialog {
    constructor(id, authenticationDialog, databaseServices) {
        super(id || RETRIEVE_EVIDENCE_DIALOG);
        this.dbServices = databaseServices;
        this.timestampedEvidence = {};
        this.evidence = [];
        this.images = [];
        this.videos = [];
        this.audio = [];
        this.text = [];

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(authenticationDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initializeUserEvidence.bind(this),
                this.categorizeEvidence.bind(this),
                this.authStep.bind(this),
                this.showEvidenceByTimestampPrompt.bind(this),
                this.showSelectedEvidence.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initializeUserEvidence(stepContext) {
        const userID = stepContext.parent.context.activity.from.id;
        const user = await this.dbServices.getUser(userID);
        if (!user) {
            return stepContext.context.sendActivity('We do not have any evidence for you');
        }

        const statementIDs = user.statements;
        let index = 0;

        for (const statementIDIndex in statementIDs) {
            const currentStatementID = statementIDs[statementIDIndex];
            const statementData = await this.dbServices.readFromDatabase([currentStatementID]);
            const currentObject = statementData[currentStatementID];
            const timestamp = currentObject.statement.date;

            const evidenceArray = await this.dbServices.readFromDatabase([currentStatementID]);

            for (const evidenceForStatementIndex in evidenceArray[currentStatementID].statement.evidence) {
                const evidenceData = evidenceArray[currentStatementID].statement.evidence[evidenceForStatementIndex];
                this.evidence[index] = {
                    ...evidenceData,
                    timestamp
                };
                index++;
            }
        }
        return await stepContext.next();
    }

    async categorizeEvidence(stepContext) {
        let index = 0;
        let imageIndex = 0;
        let videosIndex = 0;
        let audioIndex = 0;
        let textIndex = 0;

        for (index in this.evidence) {
            if (this.evidence[index].contentType.search('image') !== -1) {
                this.images[imageIndex] = this.evidence[index];
                imageIndex++;
            } else if (this.evidence[index].contentType.search('video') !== -1) {
                this.videos[videosIndex] = this.evidence[index];
                videosIndex++;
            } else if (this.evidence[index].contentType.search('audio') !== -1) {
                this.audio[audioIndex] = this.evidence[index];
                audioIndex++;
            } else {
                this.text[textIndex] = this.evidence[index];
                textIndex++;
            }
        }
        return await stepContext.next();
    }

    async authStep(stepContext) {
        return await stepContext.beginDialog(AUTHENTICATION_DIALOG, stepContext.result);
    }

    async showEvidenceByTimestampPrompt(stepContext) {
        const sortedEvidence = this.evidence.sort(function(a, b) {
            return a.timestamp > b.timestamp;
        });
        const COUNT_TEXT = 'You have ' + this.images.length + ' Photos' + ', ' + this.videos.length + ' Videos' + ', ' + this.audio.length + ' Audios' + ', ' + this.text.length + ' Locations' + ' data save!';
        await stepContext.context.sendActivity(COUNT_TEXT);

        if (this.evidence.length > 0) {
            let messagePrompt = 'Retrieve evidence you captured ';
            this.timestampedEvidence = [];

            sortedEvidence.forEach(async value => {
                let tempEvidence = [];
                let index = 0;
                if (this.timestampedEvidence[value.timestamp] !== undefined) {
                    tempEvidence = this.timestampedEvidence[value.timestamp].map(e => {
                        index++;
                        return e;
                    });
                } else {
                    messagePrompt = messagePrompt + '\n' + (index + 1) + '. ' + moment(new Date(value.timestamp), 'YYYYMMDD').fromNow();
                }
                tempEvidence[index] = value;
                this.timestampedEvidence[value.timestamp] = tempEvidence;
            });
            messagePrompt = messagePrompt + '\n\n' + '<Press any other key to go to the main menu>';
            return await stepContext.prompt(TEXT_PROMPT, { prompt: messagePrompt });
        } else {
            await stepContext.context.sendActivity('No evidence found');
            return await stepContext.endDialog();
        }
    }

    async showSelectedEvidence(stepContext) {
        if (!isNaN(stepContext.result) && Number(stepContext.result) > 0 && Number(stepContext.result) <= Object.keys(this.timestampedEvidence).length) {
            const selectedOption = Number(stepContext.result);
            const date = new Date(Number(Object.keys(this.timestampedEvidence)[selectedOption - 1]));
            const relativeDate = moment(date, 'YYYYMMDD').fromNow();
            const reply = {
                type: 'message',
                text: `${ relativeDate }`,
                attachments: this.timestampedEvidence[Object.keys(this.timestampedEvidence)[selectedOption - 1]]
            };
            await stepContext.context.sendActivity(reply);
            return await stepContext.replaceDialog(this.initialDialogId, {
                restartMsg: this.prompt
            });
        }

        return await stepContext.next();
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.RetrieveEvidenceDialog = RetrieveEvidenceDialog;
