const { genAI } = require('../config');

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

module.exports = { generateAIResponse, sendLongMessage };
