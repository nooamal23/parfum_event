// Logger minimaliste mais structuré (JSON en production pour être ingéré
// facilement par un système de logs centralisé type Loki/ELK/CloudWatch).
const env = require('../config/env');

function format(level, message, meta) {
  if (env.isProduction) {
    return JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() });
  }
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${level.toUpperCase()}] ${message}${metaStr}`;
}

module.exports = {
  info: (message, meta) => console.log(format('info', message, meta)),
  warn: (message, meta) => console.warn(format('warn', message, meta)),
  error: (message, err) =>
    console.error(format('error', message, err instanceof Error ? { message: err.message, stack: err.stack } : err)),
};
