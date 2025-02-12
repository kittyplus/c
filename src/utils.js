const { SALES_LINKS } = require('./config');

exports.addSalesCTAs = (text) => {
  if (/(price|cost)/i.test(text)) {
    return `${text}<br><a href="${SALES_LINKS.pricing.url}">${SALES_LINKS.pricing.text}</a>`;
  }
  return text;
};