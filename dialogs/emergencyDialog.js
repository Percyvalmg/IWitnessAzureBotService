const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { LuisRecognizer } = require('botbuilder-ai');
const { OtherHelpDialog} = require('./otherHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const EMERGENCY_WATERFALL_DIALOG = 'emergencyWaterfallDialog';

class EmergencyDialog extends CancelAndHelpDialog {
    constructor(id, luisRecognizer) {
        super(id || 'emergencyDialog');
        this.luisRecognizer = luisRecognizer;
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new OtherHelpDialog('otherHelpDialog'))
            .addDialog(new WaterfallDialog(EMERGENCY_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = EMERGENCY_WATERFALL_DIALOG;
    }

    async introStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, 'Should I call the Police or ask for other help?', ['police', 'other help']);
    }

    async actStep(stepContext) {

        const response = {};

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log('result', luisResult);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'OtherHelp': {
            // Run the emergencyDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('otherHelpDialog');
        }

        case 'CallPolice': {
            // Run the captureEvidenceDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.context.sendActivity('This is the police section') ;
        }
        
        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })\n
             \n\n The IWitness Team is currently working on making me better`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    async actStep(stepContext) {
    
        // const previousResponse = stepContext.result;
        // if (previousResponse.contains('police')) {
        //     return await stepContext.next();
        // } else {
        //     return await stepContext.beginDialog('otherHelpDialog');
        // }

        const response = {};

        // if (!this.luisRecognizer.isConfigured) {
        //     // LUIS is not configured, we just run the BookingDialog path.
        //     console.log('LUIS is not configured, we just run the BookingDialog path');
        //     return await stepContext.beginDialog('emergencyDialog', response);
        // }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log('result', luisResult);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'OtherHelp': {
            // Run the emergencyDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('otherHelpDialog');
        }

        case 'CallPolice': {
            // Run the captureEvidenceDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.context.sendActivity('This is the police section') ;
        }
        
        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })\n
             \n\n The IWitness Team is currently working on making me better`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }


    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.EmergencyDialog = EmergencyDialog;
