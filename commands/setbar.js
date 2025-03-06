const { SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('../models/serverConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbar')
        .setDescription('Tentukan channel tempat Monsal berbicara')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel untuk Monsal')
                .setRequired(true)),

    async execute(interaction) {
        // Pastikan user punya izin mengelola server
        if (!interaction.member.permissions.has("MANAGE_GUILD")) {
            return interaction.reply({ content: "Kamu tidak memiliki izin untuk melakukan ini!", ephemeral: true });
        }

        const channel = interaction.options.getChannel("channel");

        // Simpan atau perbarui konfigurasi channel bar untuk server ini
        await ServerConfig.findOneAndUpdate(
            { guildId: interaction.guildId },
            { barChannelId: channel.id },
            { upsert: true }
        );

        interaction.reply(`Baiklah! Sekarang aku hanya akan berbicara di ${channel}.`);
    }
};
