module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot aktif sebagai ${client.user.tag}!`);
        setInterval(() => {
            client.channels.cache.get(process.env.BAR_CHANNEL_ID)?.send("*Monsal membersihkan gelas dan mengamati sekeliling bar...* ");
        }, 300000);
    }
};
