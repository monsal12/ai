const mongoose = require('mongoose');

const ServerConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true }, // ID server
    barChannelId: { type: String, required: true } // ID channel untuk bot aktif
});

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);
