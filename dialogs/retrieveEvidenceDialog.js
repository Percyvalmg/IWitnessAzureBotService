const { InputHints } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const AUTHENTICATION_DIALOG = 'AUTHENTICATION_DIALOG';

class RetrieveEvidenceDialog extends CancelAndHelpDialog {
    constructor(id, databaseServices, authenticationDialog, userID) {
        super(id || 'retrieveEvidenceDialog');
        this.dbServices = databaseServices
        this.userID = userID
        const userData = {
            id: "5cff0de4-f95f-492d-a892-aa3504ec4169",
            realId: "5cff0de4-f95f-492d-a892-aa3504ec4169",
            document: {
                statement: {
                    text: "Died and came back",
                    evidence: [
                        {
                            name: "Screenshot 2020-09-26 at 20.15.32.png",
                            contentType: "image/png",
                            contentUrl: "https://72fbbc2e1b20.ngrok.io/v3/attachments/a7b960b0-0e3d-11eb-8007-4d13c7a927ff/views/original"
                        }
                    ],
                    id: "f785c015-6d7a-43b1-8c98-4b91367faa67"
                }
            },
            _rid: "ipUBAJdXJsM-AAAAAAAAAA==",
            _self: "dbs/ipUBAA==/colls/ipUBAJdXJsM=/docs/ipUBAJdXJsM-AAAAAAAAAA==/",
            _etag: "\"c3000d03-0000-0700-0000-5f872ce20000\"",
            _attachments: "attachments/",
            _ts: 1602694370
        }
        //this.dbServices.readFromDatabase([this.userID]) 
        this.evidenceArr = userData.document.statement.evidence;
        console.log(this.evidenceArr)

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(authenticationDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.authStep.bind(this),
                this.showAllStoredEvidence.bind(this),
                this.retrieveSelectedEvidence.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to retrieve your evidence?\n\n', ['yes', 'no']);
    }

    async authStep(stepContext) {
        if (stepContext.result) {
            return await stepContext.beginDialog(AUTHENTICATION_DIALOG, stepContext.result);
        }

        return await stepContext.endDialog();
    }

    async showAllStoredEvidence(stepContext) {
        if (stepContext.result && this.evidenceArr.length > 0) {
            let promptText = "";
            let index = 0;
            this.evidenceArr.map(obj => {
                console.log(promptText)
                promptText = promptText + "\n" + (index+1) + "." +  obj.name + "\n";
            })
            promptText = promptText + "\n  <Press any other key to exit>"
            
            const promptOptions = { prompt: "Please choose which evidence you would like to retrieve:"  + "\n" + promptText };
            return await stepContext.prompt(TEXT_PROMPT, promptOptions);
        } else {
            return await stepContext.next('No evidence found');
        }
    }

    async retrieveSelectedEvidence(stepContext) {
        const selectedEvidence = stepContext.options;
        selectedEvidence.text = stepContext.result;
        if(selectedEvidence.text == 'No evidence found'){
            return await stepContext.endDialog();
        }else if(Int(statement.text)){
            const selectedIndex = Int(statement.text - 1)
            if(selectedIndex >= 0 && selectedIndex < this.evidenceArr.length){
                const msg = this.evidenceArr[selectedIndex].contentUrl
                await stepContext.context.sendActivity(msg);
            }else{
                this.showAllStoredEvidence(stepContext)
            }
        }
    }

    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.RetrieveEvidenceDialog = RetrieveEvidenceDialog;
