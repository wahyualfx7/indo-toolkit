'use strict';

const BANKS = [
  ['CIMB Niaga', /\b(?:cimb\s*niaga|cimb)\b/i],
  ['Bank Syariah Indonesia', /\b(?:bank\s+syariah\s+indonesia|bsi)\b/i],
  ['Bank Mandiri', /\b(?:bank\s+mandiri|mandiri)\b/i],
  ['Bank Permata', /\b(?:bank\s+permata|permata)\b/i],
  ['SeaBank', /\bsea\s*bank\b/i],
  ['Bank Jago', /\b(?:bank\s+jago|jago)\b/i],
  ['Jenius', /\bjenius\b/i],
  ['BCA', /\b(?:bank\s+central\s+asia|bca)\b/i],
  ['BRI', /\b(?:bank\s+rakyat\s+indonesia|bri)\b/i],
  ['BNI', /\b(?:bank\s+negara\s+indonesia|bni)\b/i],
  ['BTN', /\b(?:bank\s+tabungan\s+negara|btn)\b/i],
];

/** Heuristic extractor. Does not check whether an account exists or belongs to anyone. */
function parseBank(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text) return null;
  const bank = BANKS.find(([, re]) => re.test(text))?.[0] ?? null;

  // Explicit account labels take precedence. Do not silently treat unlabeled phone numbers as accounts.
  const explicit = text.match(/\b(?:no(?:mor)?\.?\s*(?:rekening|rek)\.?|rekening|rek\.)\s*[:#=-]?\s*((?:\d[\s.-]?){7,19}\d)/i);
  let accountNumber = explicit ? explicit[1].replace(/\D/g, '') : null;
  if (!accountNumber && bank) {
    // Bank followed directly by an account number (possibly formatted with hyphens/spaces).
    const compact = text.match(/\b(?:cimb\s*niaga|bank\s+syariah\s+indonesia|bank\s+mandiri|bank\s+permata|sea\s*bank|bank\s+jago|jenius|bca|bri|bni|bsi|btn|mandiri|permata)\s*[:#=-]?\s*((?:\d[\s.-]?){7,19}\d)/i);
    accountNumber = compact ? compact[1].replace(/\D/g, '') : null;
  }
  if (accountNumber && !/^\d{8,18}$/.test(accountNumber)) accountNumber = null;

  const name = text.match(/\b(?:a\.?\s*n\.?|atas\s+nama|pemilik)\s*[:=-]?\s*([^\n,;]+)/i);
  const accountName = name ? name[1].trim().replace(/[.\s]+$/, '') || null : null;
  if (!bank && !accountNumber && !accountName) return null;
  return {
    bank,
    accountNumber,
    accountName,
    verified: false,
  };
}

module.exports = { parseBank };
