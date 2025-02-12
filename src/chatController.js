const { getChatResponse } = require('./deepseekService');
const { addSalesCTAs } = require('../utils');

exports.handleChat = async (req, res) => {
  const userMessage = req.body.message;
  const botResponse = await getChatResponse(userMessage);
  const responseWithCTAs = addSalesCTAs(botResponse);
  res.json({ response: responseWithCTAs });
};