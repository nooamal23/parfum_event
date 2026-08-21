const { Router } = require('express');
const controller = require('../controllers/admin.controller');
const { requireAdminAuth } = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter');

const niveauController = require('../controllers/niveau.controller');
const { validate } = require('../middlewares/validate');
const { niveauSchema, niveauUpdateSchema } = require('../validators/niveau.validator');
const { uploadNiveauImage } = require('../middlewares/upload.middleware');


const router = Router();

router.post('/login', loginLimiter, controller.login);

// Tout ce qui suit exige un JWT admin valide.
router.use(requireAdminAuth);
router.get('/participants', controller.listParticipants);
router.delete('/participants/:id', controller.deleteParticipant);
router.post('/participants/:id/envoyer-info', controller.sendInfoEmail);
router.get('/stats', controller.getStats);
router.get('/niveaux', niveauController.listAdmin);
router.post('/niveaux', uploadNiveauImage.single('image'), validate(niveauSchema), niveauController.create);
router.put('/niveaux/:id', uploadNiveauImage.single('image'), validate(niveauUpdateSchema), niveauController.update);
router.delete('/niveaux/:id', niveauController.remove);

module.exports = router;
