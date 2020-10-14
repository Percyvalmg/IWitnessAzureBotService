// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const restify = require('restify');

const { CosmosDbPartitionedStorage } = require('botbuilder-azure');
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, ConversationState, InputHints, MemoryStorage, UserState } = require('botbuilder');

const { IWitnessRecognizer } = require('./dialogs/iWitnessRecognizer');
const { DatabaseService } = require('./services/databaseService');
// This bot's main dialog.
const { MainMenuDialog } = require('./dialogs/mainMenuDialog');
const { IWitnessBot } = require('./bots/iwitnessBot');

const { CaptureEvidenceDialog } = require('./dialogs/captureEvidenceDialog');
const CAPTURE_EVIDENCE_DIALOG = 'captureEvidenceDialog';
const { EmergencyDialog } = require('./dialogs/emergencyDialog');
const EMERGENCY_DIALOG = 'emergencyDialog';
const { RetrieveEvidenceDialog } = require('./dialogs/retrieveEvidenceDialog');
const RETRIEVE_EVIDENCE_DIALOG = 'retrieveEvidenceDialog';
const { AuthenticationDialog } = require('./dialogs/authenticationDialog');
const AUTHENTICATION_DIALOG = 'AUTHENTICATION_DIALOG';
const { CaptureDialog } = require('./dialogs/captureDialog');
const CAPTURE_WATERFALL_DIALOG = 'CAPTURE_WATERFALL_DIALOG';

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
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

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    let onTurnErrorMessage = 'The bot encountered an error or bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    // Clear out state
    await conversationState.delete(context);
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// If configured, pass in the FlightBookingRecognizer.  (Defining it externally allows it to be mocked for tests)
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
    applicationId: LuisAppId,
    endpointKey: LuisAPIKey,
    endpoint: `https://${ LuisAPIHostName }`
};

const luisRecognizer = new IWitnessRecognizer(luisConfig);
const databaseService = new DatabaseService(storage);
// Create all the dialogs
const captureDialog = new CaptureDialog(CAPTURE_WATERFALL_DIALOG);
const authenticationDialog = new AuthenticationDialog(AUTHENTICATION_DIALOG, databaseService);
const captureEvidenceDialog = new CaptureEvidenceDialog(CAPTURE_EVIDENCE_DIALOG, authenticationDialog, captureDialog, databaseService);
const emergencyDialog = new EmergencyDialog(EMERGENCY_DIALOG, luisRecognizer);
const retrieveEvidenceDialog = new RetrieveEvidenceDialog(RETRIEVE_EVIDENCE_DIALOG);
const mainMenuDialog = new MainMenuDialog(luisRecognizer, emergencyDialog, captureEvidenceDialog, retrieveEvidenceDialog);

const twilioBot = new IWitnessBot(conversationState, userState, mainMenuDialog);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await twilioBot.run(turnContext);
    });
});

const { TwilioWhatsAppAdapter } = require('@botbuildercommunity/adapter-twilio-whatsapp');
const whatsAppAdapter = new TwilioWhatsAppAdapter({
    accountSid: process.env.AccountSID, // Account SID
    authToken: process.env.AuthToken, // Auth Token
    phoneNumber: 'whatsapp:+14155238886', // The From parameter consisting of whatsapp: followed by the sending WhatsApp number (using E.164 formatting)
    endpointUrl: 'https://iwitness.azurewebsites.net/api/whatsapp/messages' // Endpoint URL you configured in the sandbox, used for validation
}, {
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// WhatsApp endpoint for Twilio
server.post('/api/whatsapp/messages', (req, res) => {
    whatsAppAdapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await twilioBot.run(context);
    });
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new BotFrameworkAdapter({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword
    });
    // Set onTurnError for the BotFrameworkAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    streamingAdapter.useWebSocket(req, socket, head, async (context) => {
        // After connecting via WebSocket, run this logic for every request sent over
        // the WebSocket connection.
        await twilioBot.run(context);
    });
});
