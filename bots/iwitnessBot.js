const { DialogBot } = require('./dialogBot');

class IWitnessBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }
            await next();
        });
    }
}

module.exports.IWitnessBot = IWitnessBot;
