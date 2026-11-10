const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

router.get('/', graphController.getGraph);
router.get('/suggestions', graphController.getSuggestions);

module.exports = router;
