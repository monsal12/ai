const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let activeUser = null;
let idleTimer = null;

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    discordId: String,
    name: String,
    age: Number,
    gender: String,
    eyeColor: String,
    hairColor: String,
    hairstyle: String
});
const User = mongoose.model('User', UserSchema);

async function generateAIResponse(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(prompt);
    return response.response.text();
}

async function sendLongMessage(channel, message) {
    const chunks = message.match(/.{1,1900}(?:\s|$)/gs) || [];
    for (const chunk of chunks) {
        await channel.send(chunk);
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(() => {
        if (!activeUser) {
            client.channels.cache.get(process.env.BAR_CHANNEL_ID)?.send("*Monsal membersihkan gelas dan mengamati sekeliling bar...* ");
        }
    }, 300000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.toLowerCase().startsWith("monsal")) return;
    
    const userId = message.author.id;
    const user = await User.findOne({ discordId: userId });

    if (!user) {
        message.reply("Aku tak mengenalmu, anak muda. Daftarkan dirimu dulu dengan `/register` sebelum bicara denganku.");
        return;
    }
    
    if (activeUser && userId !== activeUser) {
        message.reply("Sabar, anak muda. Aku sedang berbicara dengan pelanggan lain. Tunggu sebentar...");
        return;
    }
    
    if (!activeUser) {
        activeUser = userId;
        message.reply(`*Monsal menatap ${user.name} dengan tajam, menunggu kata-katamu...*`);
    }
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        message.reply("Hmph... Diam saja? Baiklah, aku punya hal lain yang harus kulakukan.");
        activeUser = null;
    }, 300000);
    
    if (message.content.toLowerCase().includes("menu")) {
        const aiResponse = await generateAIResponse("Kamu adalah Monsal, seorang bartender veteran di dunia medieval. Ketika ada yang meminta menu, buatlah daftar makanan dan minuman yang cocok dengan suasana medieval dengan sedikit interaksi natural.");
        sendLongMessage(message.channel, aiResponse);
    } else if (message.content.toLowerCase().includes("selesai") || message.content.toLowerCase().includes("terima kasih")) {
        message.reply("Baiklah, semoga perjalananmu menyenangkan. Jangan lupa kembali lagi ke barnya Monsal!");
        activeUser = null;
    } else if (message.content.toLowerCase().includes("berkelahi")) {
        message.reply("*Monsal menyeringai dan meretakkan buku jarinya.* Kau yakin ingin mencoba peruntunganmu, bocah?");
    } else {
        const aiResponse = await generateAIResponse(
            `Kamu adalah Monsal, seorang bartender veteran di dunia medieval. 
            Kamu sedang berbicara dengan ${user.name}, seorang pelanggan tetap di barnya. 
            Dia adalah seorang ${user.gender} dengan mata ${user.eye_color}, 
            rambut ${user.hair_color}, dan gaya rambut ${user.hairstyle}. 
            Pastikan responsmu sesuai dengan interaksi sebelumnya dan tetap sesuai karaktermu. 
            Balas ini: ${message.content}`
        );
        sendLongMessage(message.channel, aiResponse);      
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    if (interaction.commandName === "register") {
        const name = interaction.options.getString("name");
        const age = interaction.options.getInteger("age");
        const gender = interaction.options.getString("gender");
        const eyeColor = interaction.options.getString("eyeColor");
        const hairColor = interaction.options.getString("hairColor");
        const hairstyle = interaction.options.getString("hairstyle");
        
        await User.findOneAndUpdate(
            { discordId: interaction.user.id },
            { name, age, gender, eyeColor, hairColor, hairstyle },
            { upsert: true }
        );
        
        interaction.reply(`Baiklah, ${name}. Aku akan mengingatmu.`);
    }
});

const commands = [
    new SlashCommandBuilder()
        .setName('register')
        .setDescription('Daftarkan dirimu di barnya Monsal')
        .addStringOption(option => option.setName('name').setDescription('Nama karaktermu').setRequired(true))
        .addIntegerOption(option => option.setName('age').setDescription('Usia karaktermu').setRequired(true))
        .addStringOption(option => option.setName('gender').setDescription('Jenis kelamin (pria/wanita)').setRequired(true))
        .addStringOption(option => option.setName('eye_color').setDescription('Warna mata karaktermu').setRequired(true))
        .addStringOption(option => option.setName('hair_color').setDescription('Warna rambut karaktermu').setRequired(true))
        .addStringOption(option => option.setName('hairstyle').setDescription('Gaya rambut karaktermu').setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Mendaftarkan ulang perintah slash...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Perintah slash berhasil diperbarui!');
    } catch (error) {
        console.error('Gagal memperbarui perintah slash:', error);
    }
})();

client.login(process.env.DISCORD_TOKEN);
