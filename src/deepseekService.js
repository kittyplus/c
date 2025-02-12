const axios = require('axios');
const { DEEPSEEK_API_URL } = require('./config');

exports.getChatResponse = async (message) => {
  const response = await axios.post(DEEPSEEK_API_URL, {
    messages: [{ role: 'user', content: message }]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
};