const { Router } = require('express');
const controller = require('../controllers/inscription.controller');
const { validate } = require('../middlewares/validate');
const { inscriptionSchema } = require('../validators/inscription.validator');
const { inscriptionLimiter } = require('../middlewares/rateLimiter');

const router = Router();

router.post('/', inscriptionLimiter, validate(inscriptionSchema), controller.register);
router.get('/valider/:token', controller.validateEmail);
router.post('/renvoyer', inscriptionLimiter, controller.resendValidation);

module.exports = router;
