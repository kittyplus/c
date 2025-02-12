// server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files from the "public" folder

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // Load from .env
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Rate limiting (5 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5
});
app.use('/chat', limiter);

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Sales CTAs (Call-to-Action links)
const SALES_LINKS = {
  pricing: { url: 'https://example.com/pricing', text: 'View Pricing' },
  demo: { url: 'https://example.com/demo', text: 'Book a Demo' },
  support: { url: 'https://example.com/support', text: 'Contact Support' }
};

// Helper function to add CTAs to bot responses
function addSalesCTAs(text) {
  if (/(price|cost)/i.test(text)) {
    return `${text}<br><a href="${SALES_LINKS.pricing.url}" target="_blank">${SALES_LINKS.pricing.text}</a>`;
  }
  if (/(demo|show)/i.test(text)) {
    return `${text}<br><a href="${SALES_LINKS.demo.url}" target="_blank">${SALES_LINKS.demo.text}</a>`;
  }
  if (/(help|support)/i.test(text)) {
    return `${text}<br><a href="${SALES_LINKS.support.url}" target="_blank">${SALES_LINKS.support.text}</a>`;
  }
  return text;
}

// Chat endpoint
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Call DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        messages: [{ role: 'user', content: userMessage }],
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract bot response
    const botResponse = response.data.choices[0].message.content;

    // Add sales CTAs to the response
    const responseWithCTAs = addSalesCTAs(botResponse);

    // Send response back to the client
    res.json({ response: responseWithCTAs });

  } catch (error) {
    console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});