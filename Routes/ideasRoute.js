const express = require('express');
const router = express.Router();

const ideasController = require('../controller/ideasController')

router.get('/', ideasController.getAllIdeas);
router.get('/ideas', ideasController.getAllIdeas);
router.post('/ideas', ideasController.createIdea);
router.delete('/ideas', ideasController.deleteIdea);
router.put('/ideas', ideasController.updateIdea);
router.get('/ideasRandom', ideasController.getRandomIdea);

module.exports = router;