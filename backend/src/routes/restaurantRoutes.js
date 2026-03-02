const express = require('express');
const {
    listNearby,
    getById,
    getMenu,
    search,
    filter,
    getCuisines
} = require('../controllers/restaurantController');

const router = express.Router();

// Public routes
router.get('/', listNearby);
router.get('/search', search);
router.get('/cuisines', getCuisines);
router.post('/filter', filter);
router.get('/:id', getById);
router.get('/:id/menu', getMenu);

module.exports = router;
