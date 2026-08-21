const { Router } = require('express');
const inscriptionRoutes = require('./inscription.routes');
const adminRoutes = require('./admin.routes');

const niveauRoutes = require('./niveau.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/inscriptions', inscriptionRoutes);
router.use('/admin', adminRoutes);

router.use('/niveaux', niveauRoutes);

module.exports = router;
