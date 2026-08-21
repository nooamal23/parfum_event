require('express-async-errors'); // permet d'utiliser async/await dans les controllers sans try/catch manuel
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// helmet() envoie par défaut "Cross-Origin-Resource-Policy: same-origin" sur toutes
// les réponses. Comme le frontend et le backend sont des origines différentes, le
// navigateur bloque silencieusement le chargement des images malgré un 200 OK.
// On assouplit cette policy uniquement pour /uploads (contenu public par nature).
app.use(
  '/uploads',
  helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
  express.static(path.join(__dirname, '../uploads'))
);

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

app.use(errorHandler);

module.exports = app;