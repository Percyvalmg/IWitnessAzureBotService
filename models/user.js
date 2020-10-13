class User {
    constructor(id, password) {
        this.id = id;
        this.password = password;
        this.statements = [];
    }
}

module.exports.User = User;
