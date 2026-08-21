const theme = require('../config/emailTheme');

function eventInfoEmailTemplate({ prenom, event }) {
  const { date, heure, lieu, prix, notes } = event;

  // Ligne omise proprement si la valeur n'est pas renseignée dans .env,
  // plutôt que d'afficher "Prix : " ou "Heure : " vide dans l'e-mail.
  const rows = [
    ['📅 Date', date],
    heure ? ['🕐 Heure', heure] : null,
    ['📍 Lieu', lieu],
    prix ? ['💶 Prix', prix] : null,
  ].filter(Boolean);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0; font-weight:bold; color:${theme.primaryDark}; width:120px;">${label}</td>
          <td style="padding:10px 0; color:${theme.ink};">${value}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family: ${theme.fontFamily}; max-width: 480px; margin: auto; color: ${theme.ink};">
      <h2 style="color: ${theme.primary};">Bonjour ${prenom},</h2>
      <p>Voici toutes les informations pratiques pour votre venue à l'événement
      <strong>Univers des Parfums</strong> :</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        ${rowsHtml}
      </table>
      ${notes ? `<p style="font-size: 14px; color: ${theme.muted};">${notes}</p>` : ''}
      <p>Nous avons hâte de vous accueillir !</p>
      <p>À très bientôt,<br/>L'équipe Univers des Parfums</p>
    </div>
  `;
}

module.exports = eventInfoEmailTemplate;
