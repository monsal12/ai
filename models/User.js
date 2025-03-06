const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: String,
    name: String,
    age: Number,
    gender: String,
    eyeColor: String,
    hairColor: String,
    hairstyle: String
});

module.exports = mongoose.model('User', UserSchema);
