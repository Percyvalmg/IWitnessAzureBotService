// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const restify = require('restify');
const { CosmosDbPartitionedStorage } = require('botbuilder-azure');
const { BotFrameworkAdapter, ConversationState, InputHints, MemoryStorage, UserState } = require('botbuilder');
const { IWitnessRecognizer } = require('./dialogs/iWitnessRecognizer');
const { DatabaseService } = require('./services/databaseService');
const { MainMenuDialog } = require('./dialogs/mainMenuDialog');
const { IWitnessBot } = require('./bots/iwitnessBot');
const {
    CAPTURE_EVIDENCE_DIALOG,
    EMERGENCY_DIALOG,
    RETRIEVE_EVIDENCE_DIALOG,
    RETRIEVAL_MENU_DIALOG,
    AUTHENTICATION_DIALOG,
    CAPTURE_DIALOG,
    OTHER_HELP_DIALOG,
    CALL_POLICE_DIALOG,
    CALL_POLICE_ON_BEHALF_OF_DIALOG,
    PROTECTION_ORDER_DIALOG,
    PLACE_OF_SAFETY_DIALOG,
    COUNSELLOR_DIALOG
} = require('./models/dialogIdConstants');
const { CaptureEvidenceDialog } = require('./dialogs/captureEvidenceDialog');
const { EmergencyDialog } = require('./dialogs/emergencyDialog');
const { RetrieveEvidenceDialog } = require('./dialogs/retrieveEvidenceDialog');
const { RetrievalMenuDialog } = require('./dialogs/retrievalMenuDialog');
const { AuthenticationDialog } = require('./dialogs/authenticationDialog');
const { OtherHelpDialog } = require('./dialogs/otherHelpDialog');
const { CaptureDialog } = require('./dialogs/captureDialog');
const { CallPoliceDialog } = require('./dialogs/callPoliceDialog');
const { CallPoliceOnBehalfOfDialog } = require('./dialogs/callPoliceOnBehalfOfDialog');
const { PlaceOfSafetyDialog } = require('./dialogs/placeOfSafetyDialog');
const { ProtectionOrderDialog } = require('./dialogs/protectionOrderDialog');
const { CounsellorDialog } = require('./dialogs/counsellorDialog');

const { TwilioWhatsAppAdapter } = require('@botbuildercommunity/adapter-twilio-whatsapp');
const { FacebookAdapter } = require('botbuilder-adapter-facebook');

const facebookAdapter = new FacebookAdapter({
    verify_token: process.env.facebookVerifyToken,
    app_secret: process.env.facebookAppSecret,
    access_token: process.env.facebookAccessToken
});

const whatsAppAdapter = new TwilioWhatsAppAdapter({
    accountSid: process.env.AccountSID,
    authToken: process.env.AuthToken,
    phoneNumber: 'whatsapp:+14155238886',
    endpointUrl: 'https://iwitness.azurewebsites.net/api/whatsapp/messages'
}, {
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const storage = new CosmosDbPartitionedStorage({
    cosmosDbEndpoint: process.env.CosmosDbEndpoint,
    authKey: process.env.CosmosDbAuthKey,
    databaseId: process.env.CosmosDbDatabaseId,
    containerId: process.env.CosmosDbContainerId,
    compatibilityMode: false
});

const onTurnErrorHandler = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    if (error.contains('LUIS Recognition Error')) {
        return;
    }

    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    let onTurnErrorMessage = 'The bot encountered an error or bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    await conversationState.delete(context);
};

adapter.onTurnError = onTurnErrorHandler;

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
    applicationId: LuisAppId,
    endpointKey: LuisAPIKey,
    endpoint: `https://${ LuisAPIHostName }`
};
const luisRecognizer = new IWitnessRecognizer(luisConfig);
const databaseService = new DatabaseService(storage);

const placeOfSafetyDialog = new PlaceOfSafetyDialog(PLACE_OF_SAFETY_DIALOG);
const counsellorDialog = new CounsellorDialog(COUNSELLOR_DIALOG);
const protectionOrderDialog = new ProtectionOrderDialog(PROTECTION_ORDER_DIALOG);
const callPoliceOnBehalfOfDialog = new CallPoliceOnBehalfOfDialog(CALL_POLICE_ON_BEHALF_OF_DIALOG);
const callPoliceDialog = new CallPoliceDialog(CALL_POLICE_DIALOG, callPoliceOnBehalfOfDialog);
const authenticationDialog = new AuthenticationDialog(AUTHENTICATION_DIALOG, databaseService);
const otherHelpDialog = new OtherHelpDialog(OTHER_HELP_DIALOG, luisRecognizer, protectionOrderDialog, placeOfSafetyDialog, counsellorDialog);
const captureDialog = new CaptureDialog(CAPTURE_DIALOG);
const captureEvidenceDialog = new CaptureEvidenceDialog(CAPTURE_EVIDENCE_DIALOG, authenticationDialog, captureDialog, databaseService);
const emergencyDialog = new EmergencyDialog(EMERGENCY_DIALOG, luisRecognizer, otherHelpDialog, callPoliceDialog);
const retrievalMenuDialog = new RetrievalMenuDialog(RETRIEVAL_MENU_DIALOG, databaseService);
const retrieveEvidenceDialog = new RetrieveEvidenceDialog(RETRIEVE_EVIDENCE_DIALOG, authenticationDialog, retrievalMenuDialog);
const mainMenuDialog = new MainMenuDialog(luisRecognizer, emergencyDialog, captureEvidenceDialog, retrieveEvidenceDialog, callPoliceDialog, otherHelpDialog);

const bot = new IWitnessBot(conversationState, userState, mainMenuDialog);

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        await bot.run(turnContext);
    });
});

server.post('/api/whatsapp/messages', (req, res) => {
    whatsAppAdapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

server.post('/api/facebook', (req, res) => {
    facebookAdapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

server.on('upgrade', (req, socket, head) => {
    const streamingAdapter = new BotFrameworkAdapter({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword
    });
    streamingAdapter.onTurnError = onTurnErrorHandler;

    streamingAdapter.useWebSocket(req, socket, head, async (context) => {
        await bot.run(context);
    });
});
