require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [];
const fs = require('fs');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Pastikan CLIENT_ID ada di .env

if (!token) {
    console.error("❌ Error: DISCORD_TOKEN tidak ditemukan!");
    process.exit(1);
}

fs.readdirSync('./commands').forEach(file => {
    const command = require(`./commands/${file}`);
    if (command.data) {
        commands.push(command.data.toJSON());
    }
});

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log("🔄 Menghapus command lama...");
        await rest.put(Routes.applicationCommands(clientId), { body: [] });

        console.log("✅ Mengunggah command baru...");
        await rest.put(Routes.applicationCommands(clientId), { body: commands });

        console.log("🚀 Selesai! Command berhasil diunggah.");
    } catch (error) {
        console.error("❌ Error saat deploy command:", error);
    }
})();
