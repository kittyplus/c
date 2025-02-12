require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Rate limiting (5 requests/min)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
});
app.use('/chat', limiter);

// Configuration
const SALES_CTAS = {
  pricing: { url: 'https://example.com/pricing', text: 'View Pricing' },
  demo: { url: 'https://example.com/demo', text: 'Book Demo' },
  docs: { url: 'https://example.com/docs', text: 'Documentation' }
};

// DeepSeek API Helper
async function getChatResponse(messages) {
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.response.data);
    return null;
  }
}

// Chat Endpoint
app.post('/chat', async (req, res) => {
  if (!req.session.conversation) {
    req.session.conversation = [];
  }

  try {
    const userMessage = {
      role: "user",
      content: req.body.message
    };

    // Add to conversation history
    req.session.conversation.push(userMessage);

    // Get bot response
    const botContent = await getChatResponse(req.session.conversation);
    
    // Add sales CTAs
    const responseWithCTAs = addSalesElements(botContent);
    
    // Store bot response in history
    const botMessage = {
      role: "assistant",
      content: responseWithCTAs
    };
    req.session.conversation.push(botMessage);

    res.json({
      response: responseWithCTAs,
      sessionId: req.sessionID
    });

  } catch (error) {
    res.status(500).json({ error: "Chat service unavailable" });
  }
});

// CTA Injection Logic
function addSalesElements(text) {
  const ctas = [];
  
  if (/(price|cost|plan)/i.test(text)) {
    ctas.push(SALES_CTAS.pricing);
  }
  if (/(demo|show|example)/i.test(text)) {
    ctas.push(SALES_CTAS.demo);
  }
  if (/(help|document|guide)/i.test(text)) {
    ctas.push(SALES_CTAS.docs);
  }

  if (ctas.length > 0) {
    const links = ctas.map(cta => 
      `<a href="${cta.url}" class="cta-link" data-cta-type="${Object.keys(cta)[0]}">${cta.text}</a>`
    ).join(' ');
    return `${text}<div class="cta-container">${links}</div>`;
  }
  
  return text;
}

app.listen(3000, () => console.log('Server running on port 3000'));