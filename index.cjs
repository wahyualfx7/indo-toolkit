'use strict';

module.exports = {
  ...require('./src/chat-date.cjs'),
  ...require('./src/bank-parser.cjs'),
  ...require('./src/unit-parser.cjs'),
  ...require('./src/text-money.cjs'),
  ...require('./src/document-number.cjs'),
  ...require('./src/contact-cleaner.cjs'),
  ...require('./src/privacy-mask.cjs'),
  ...require('./src/order-parser.cjs'),
};
