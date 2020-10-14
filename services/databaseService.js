class DatabaseService {
    constructor(database) {
        this.database = database;
    }

    async getUser(id) {
        const response = await this.readFromDatabase([id]);
        console.log('response', response);
        if (response[id] === undefined) {
            return false;
        }

        return response[id].user;
    }

    async writeToDatabase(data) {
        try {
            await this.database.write(data);
        } catch (err) {
            console.log('Error', err);
        }
    }

    async readFromDatabase(arrayOfKeys) {
        try {
            return await this.database.read(arrayOfKeys);
        } catch (err) {
            console.log('Error', err);
        }
    }
}

module.exports.DatabaseService = DatabaseService;
