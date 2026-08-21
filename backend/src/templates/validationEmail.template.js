const theme = require('../config/emailTheme');

// Construit le HTML de l'e-mail de validation d'inscription.
// Séparé de email.service.js : ce fichier ne s'occupe que du contenu,
// jamais de l'envoi (SMTP, logs, etc.).
function validationEmailTemplate({ prenom, validationUrl, emailTokenTtlMinutes }) {
  return `
    <div style="font-family: ${theme.fontFamily}; max-width: 480px; margin: auto; color: ${theme.ink};">
      <h2 style="color: ${theme.primary};">Bonjour ${prenom},</h2>
      <p>Merci pour votre candidature à l'événement <strong>Univers des Parfums</strong>.</p>
      <p>Pour confirmer votre inscription, cliquez sur le bouton ci-dessous. Ce lien est valable
      <strong>${emailTokenTtlMinutes} minutes</strong>.</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="${validationUrl}"
           style="background:${theme.primary}; color:${theme.surface}; padding:12px 28px; border-radius:8px;
                  text-decoration:none; font-weight:bold;">
          Confirmer mon inscription
        </a>
      </p>
      <p style="font-size: 13px; color: ${theme.muted};">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
        ${validationUrl}
      </p>
    </div>
  `;
}

module.exports = validationEmailTemplate;
