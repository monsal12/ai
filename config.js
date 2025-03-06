require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Terhubung ke MongoDB!"))
  .catch(err => console.error("❌ Gagal koneksi MongoDB:", err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = { genAI };
