const express = require('express');
const router = express.Router();
const recipeAlchemistController = require('../controllers/recipeAlchemistController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/synthesize', recipeAlchemistController.synthesizeRecipe);
router.get('/suggestions', recipeAlchemistController.getSuggestions);

module.exports = router;
