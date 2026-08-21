const theme = require('../config/emailTheme');

function confirmationEmailTemplate({ prenom }) {
  return `
    <div style="font-family: ${theme.fontFamily}; max-width: 480px; margin: auto; color: ${theme.ink};">
      <h2 style="color: ${theme.primary};">C'est confirmé, ${prenom} !</h2>
      <p>Votre inscription à l'événement <strong>Univers des Parfums</strong> est définitivement enregistrée.</p>
      <p>Nous vous communiquerons prochainement la date, le lieu et toutes les informations pratiques.</p>
      <p>À très bientôt,<br/>L'équipe Univers des Parfums</p>
    </div>
  `;
}

module.exports = confirmationEmailTemplate;
