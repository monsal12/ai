const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Daftarkan dirimu di barnya Monsal')
        .addStringOption(option => option.setName('name').setDescription('Nama karaktermu').setRequired(true))
        .addIntegerOption(option => option.setName('age').setDescription('Usia karaktermu').setRequired(true))
        .addStringOption(option => option.setName('gender').setDescription('Jenis kelamin (pria/wanita)').setRequired(true))
        .addStringOption(option => option.setName('eye_color').setDescription('Warna mata karaktermu').setRequired(true))
        .addStringOption(option => option.setName('hair_color').setDescription('Warna rambut karaktermu').setRequired(true))
        .addStringOption(option => option.setName('hairstyle').setDescription('Gaya rambut karaktermu').setRequired(true)),

    async execute(interaction) {
        const userData = {
            discordId: interaction.user.id,
            name: interaction.options.getString("name"),
            age: interaction.options.getInteger("age"),
            gender: interaction.options.getString("gender"),
            eyeColor: interaction.options.getString("eye_color"),
            hairColor: interaction.options.getString("hair_color"),
            hairstyle: interaction.options.getString("hairstyle")
        };

        await User.findOneAndUpdate({ discordId: userData.discordId }, userData, { upsert: true });
        interaction.reply(`Baiklah, ${userData.name}. Aku akan mengingatmu.`);
    }
};
