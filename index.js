const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { executablePath } = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

// OpenRouter Config
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.MODEL || "mistralai/mistral-7b-instruct";

// Setup WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
  console.log('Scan this QR code with your WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 WhatsApp Bot is ready!');
});

client.on('message', async (message) => {
  if (message.from.includes('@g.us') || !message.body || message.body.length < 2) return;

  console.log(`📩 Received: ${message.body} from ${message.from}`);

  try {
    await message.react("⌛");
    const reply = await generateAIReply(message.body);
    await message.reply(reply);
    console.log(`💬 Replied to ${message.from}`);
  } catch (err) {
    console.error('❌ Error generating response:', err.message);
    await message.reply("Sorry, I couldn't process that. Please try again.");
  }
});

// OpenRouter Chat Function
async function generateAIReply(userInput) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userInput }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = response.data;
  return result.choices[0]?.message?.content?.trim() || "Sorry, no response.";
}

client.initialize();
