const { InputHints, builder } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const AUTHENTICATION_DIALOG = 'AUTHENTICATION_DIALOG';

class RetrieveEvidenceDialog extends CancelAndHelpDialog {
    constructor(id, authenticationDialog, databaseServices) {
        super(id || 'retrieveEvidenceDialog');
        this.dbServices = databaseServices;
        this.evidence = [];
        this.images = [];
        this.videos = [];
        this.audio = [];
        this.text = [];
        

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(authenticationDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initializeUserEvidence.bind(this),
                this.introStep.bind(this),
                this.authStep.bind(this),
                this.showAllStoredEvidence.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initializeUserEvidence(stepContext){
        // this.userID = "whatsapp:+27618492168";
        const userID = stepContext.parent.context.activity.from.id
        const user =  await this.dbServices.getUser(userID)
        if(!user) {
           return stepContext.context.sendActivity('We do not have any evidence for you');
        }
        const statementIDs = user[this.userID].user.statements;
        let index = 0;

        for(const statementIDIndex in statementIDs){
            const currentStatementID = statementIDs[statementIDIndex];
            const statementData =  await this.dbServices.readFromDatabase([currentStatementID]);
            const currentObject =  statementData[currentStatementID]
            
            for(const evidenceIndex in currentObject.statement.evidence){
                const currentEvidenceID = statementIDs[evidenceIndex];
                const evidenceArray =  await this.dbServices.readFromDatabase([currentEvidenceID]);

                for(const evidenceForStatementIndex in evidenceArray[currentEvidenceID].statement.evidence){
                    const evidenceData = evidenceArray[currentEvidenceID].statement.evidence[evidenceForStatementIndex];
                    this.evidence[index] = evidenceData;
                    index++;
                }
               
            }
        }

    }

    async categorizeEvidence(){
        let index = 0;
        let imageIndex = 0;
        let videosIndex = 0;
        let audioIndex = 0;
        let textIndex = 0;
        for(index in this.evidence) {
            if(this.evidence[index].contentType.search('image') != -1 ){
                this.images[imageIndex] = this.evidence[index];
                imageIndex++;
            }else if(this.evidence[index].contentType.search('video') != -1){
                this.videos[videosIndex] = this.evidence[index];
                videosIndex++;
            }else if(this.evidence[index].contentType.search('audio') != -1){
                this.audio[audioIndex] = this.evidence[index];
                audioIndex++
            }else {
                this.text[textIndex] = this.evidence[index];
                textIndex++
            }
        }
    }

    async introStep(stepContext) {
        await this.categorizeEvidence()
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to retrieve all your evidence?\n\n', ['yes', 'no']);
    }

    async authStep(stepContext) {
        if (stepContext.result) {
            return await stepContext.beginDialog(AUTHENTICATION_DIALOG, stepContext.result);
        }

        return await stepContext.endDialog();
    }

    async showAllStoredEvidence(stepContext) {
        const COUNT_TEXT = "You have "  + this.images.length  + " Photos" + ", " + this.videos.length +  " Videos" + ", " + this.audio.length + " Audio" + ", " + this.text.length + " Locations"  + " data save!";
        if (stepContext.result && this.evidence.length > 0) {
            let index = 0;
            const reply = {
                type: 'message',
                text: COUNT_TEXT,
                attachments: this.evidence
            };

            await stepContext.context.sendActivity(reply);

            return await stepContext.endDialog();
        } else {
            stepContext.context.sendActivity('No evidence found');
            return await stepContext.next();
        }
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.RetrieveEvidenceDialog = RetrieveEvidenceDialog;
