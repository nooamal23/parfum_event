const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const validationEmailTemplate = require('../templates/validationEmail.template');
const confirmationEmailTemplate = require('../templates/confirmationEmail.template');
const eventInfoEmailTemplate = require('../templates/eventInfoEmail.template');

// Transport SMTP créé une seule fois et réutilisé (pooling de connexions SMTP).
const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  pool: true,
  connectionTimeout: 10_000, // 10s instead of default 2min
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

async function send({ to, subject, html }) {
  // En développement sans SMTP configuré, on log le contenu au lieu d'échouer :
  // permet de tester tout le flux d'inscription sans compte SMTP réel.
  if (!env.smtp.host) {
    logger.warn(`SMTP non configuré — email simulé pour ${to}: ${subject}`);
    logger.info(html);
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}

async function sendValidationEmail({ to, prenom, rawToken }) {
  const validationUrl = `${env.frontendUrl}/valider-email/${rawToken}`;
  await send({
    to,
    subject: 'Confirmez votre inscription — Univers des Parfums',
    html: validationEmailTemplate({
      prenom,
      validationUrl,
      emailTokenTtlMinutes: env.emailTokenTtlMinutes,
    }),
  });
}

async function sendConfirmationEmail({ to, prenom }) {
  await send({
    to,
    subject: 'Inscription confirmée — Univers des Parfums',
    html: confirmationEmailTemplate({ prenom }),
  });
}

async function sendEventInfoEmail({ to, prenom }) {
  await send({
    to,
    subject: 'Informations pratiques — Univers des Parfums',
    html: eventInfoEmailTemplate({ prenom, event: env.event }),
  });
}

module.exports = { sendValidationEmail, sendConfirmationEmail, sendEventInfoEmail };
