const User = require('../models/User');
const ServerConfig = require('../models/serverConfig'); // Import ServerConfig
const { generateAIResponse, sendLongMessage } = require('../utils/aiHelper');

let activeUser = null;
let idleTimer = null;
let sessionMemory = {}; // Menyimpan history percakapan sementara

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const userId = message.author.id;
        const content = message.content.toLowerCase();
        const user = await User.findOne({ discordId: userId });

        // Cek apakah server punya bar channel yang diatur
        const serverConfig = await ServerConfig.findOne({ guildId: message.guildId });

        if (!serverConfig || !serverConfig.barChannelId) {
            return message.reply("Sepertinya aku belum punya bar di sini. Gunakan `/setbar` untuk menentukan lokasiku.");
        }

        // Jika pesan bukan di bar channel, abaikan
        if (message.channel.id !== serverConfig.barChannelId) return;

        if (!user) {
            message.reply("Aku tak mengenalmu, anak muda. Daftarkan dirimu dulu dengan `/register` sebelum bicara denganku.");
            return;
        }

        // Jika ada pengguna lain yang sedang berbicara
        if (activeUser && userId !== activeUser) {
            try {
                const previousMessage = await message.channel.messages.fetch({ limit: 2 }).then(messages => [...messages.values()][1]);
                
                if (previousMessage && previousMessage.system) {
                    message.channel.send("Sabar, anak muda. Aku sedang berbicara dengan pelanggan lain. Tunggu sebentar...");
                } else {
                    message.reply("Sabar, anak muda. Aku sedang berbicara dengan pelanggan lain. Tunggu sebentar...");
                }
            } catch (error) {
                console.error("Gagal memproses pesan:", error);
                message.channel.send("Ada yang aneh di sini... coba lagi nanti.");
            }
            return;
        }

        // Jika ini awal percakapan, harus dimulai dengan "monsal"
        if (!activeUser && !content.startsWith("monsal")) return;

        // Jika baru dipanggil, tandai pengguna aktif & mulai sesi
        if (!activeUser) {
            activeUser = userId;
            sessionMemory[userId] = []; // Mulai percakapan baru
            message.reply(`*Monsal menatap ${user.name} dengan tatapan tajam, menunggu kata-katamu...*`);
        }

        // Reset timer agar tidak idle
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            message.reply("Hmph... Diam saja? Baiklah, aku punya hal lain yang harus kulakukan.");
            delete sessionMemory[userId]; // Hapus memori percakapan
            activeUser = null;
        }, 300000);

        // Jika pemain ingin mengakhiri sesi
        if (content.includes("bye") || content.includes("selesai")) {
            message.reply("Baiklah, semoga perjalananmu menyenangkan. Jangan lupa kembali lagi ke barnya Monsal!");
            delete sessionMemory[userId]; // Hapus memori percakapan
            activeUser = null;
            return;
        }

        // Tambahkan percakapan ke memori sementara
        sessionMemory[userId].push({ user: message.content });

        // Gunakan AI dengan konteks dari percakapan sebelumnya
        const conversationHistory = sessionMemory[userId].map(entry => `Pemain: ${entry.user}`).join("\n");

        const aiResponse = await generateAIResponse(`
            Kamu adalah Monsal, seorang bartender veteran di dunia medieval. 
            - **Kepribadian:** Bijaksana, berwibawa, dan sedikit sarkastik. Suka menggoda pelanggan, tapi dengan maksud baik.
            - **Latar belakang:** Mantan jenderal perang yang bertarung dalam ratusan pertempuran, sekarang pensiun sebagai bartender.
            - **Prinsip hidup:** Menghormati yang kuat, tetapi mengajarkan pelajaran kepada yang sombong.
            - **Gaya bicara:** Keras, tetapi penuh pengalaman dan kebijaksanaan. Akan memberi nasihat atau tantangan jika perlu.
            - **Kesukaan:** Minuman keras yang berkualitas, cerita perang, dan melihat anak muda berusaha keras.
            - **Kebencian:** Pengecut, orang yang suka pamer tanpa kemampuan, dan mereka yang meremehkan veteran.
            - **Jika ada yang ingin menantang Monsal:** Dia akan menertawakan mereka dan berkata bahwa dia sudah melalui ratusan pertempuran, lalu mungkin memberi tantangan kecil.
            
            **Pelanggan saat ini:** ${user.name}, seorang ${user.gender} dengan mata ${user.eyeColor}, rambut ${user.hairColor}, dan gaya rambut ${user.hairstyle}.
            
            **Percakapan Sebelumnya:**
            ${conversationHistory}
            
            **Pesan Pemain Sekarang:** "${message.content}"
            
            **Balasan Monsal:** (Gunakan kepribadian dan konteks di atas untuk menjawab secara alami)
        `);

        // Simpan respons AI ke memori sementara
        sessionMemory[userId].push({ monsal: aiResponse });

        sendLongMessage(message.channel, aiResponse);
    }
};

