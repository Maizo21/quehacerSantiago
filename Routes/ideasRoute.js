const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const ideasController = require('../controller/ideasController')
const { requireAuth, requireAuthorized, requireAdmin } = require('../middleware/auth')

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(null, ext && mime);
    }
});

router.get('/', ideasController.getAllIdeas);
router.get('/ideas', ideasController.getAllIdeas);
router.post('/ideas', requireAuthorized, upload.single('imagen'), ideasController.createIdea);
router.delete('/ideas', requireAdmin, ideasController.deleteIdea);
router.put('/ideas', requireAuthorized, upload.single('imagen'), ideasController.updateIdea);
router.get('/ideasRandom', ideasController.getRandomIdea);
router.get('/tags', ideasController.getAllTags);
router.get('/auth/check', requireAuth, (req, res) => {
    const AUTHORIZED = (process.env.AUTHORIZED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const ADMINS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    res.json({
        authorized: AUTHORIZED.includes(req.userEmail),
        admin: ADMINS.includes(req.userEmail),
        email: req.userEmail,
        name: req.userName
    });
});

module.exports = router;
