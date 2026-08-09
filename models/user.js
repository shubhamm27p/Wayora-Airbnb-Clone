const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongooseModule = require("passport-local-mongoose");
const passportLocalMongoose = passportLocalMongooseModule.default || passportLocalMongooseModule;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);