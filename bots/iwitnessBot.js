const { DialogBot } = require('./dialogBot');

class IWitnessBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const reply = {
                        type: 'message',
                        text: 'This is a message with an attachment.',
                        attachments: [
                            {
                                contentType: 'image/png',
                                contentUrl: 'https://docs.microsoft.com/en-us/bot-framework/media/how-it-works/architecture-resize.png'
                            }
                        ]
                    };

                    await context.sendActivity(reply);
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.IWitnessBot = IWitnessBot;
