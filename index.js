require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = Number(process.env.PORT) || 8000;
const ideasRoute = require('./Routes/ideasRoute');

// Headers de seguridad
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting global: max 100 requests por minuto por IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { Error: 'Demasiadas solicitudes, intenta de nuevo en un minuto' }
});
app.use(globalLimiter);

// Rate limiting estricto para escritura: max 10 por minuto
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { Error: 'Demasiadas solicitudes de escritura, intenta de nuevo en un minuto' }
});
app.set('writeLimiter', writeLimiter);

// Rate limiting para IA: max 5 por minuto por IP (protege cuota gratuita de Gemini)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { Error: 'Demasiadas solicitudes de IA, intenta de nuevo en un minuto' }
});
app.set('aiLimiter', aiLimiter);

// CORS manual
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Body parsing con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/', ideasRoute);

// Error handler global — no exponer detalles internos
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ Error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', ()=>{
    console.log(`Listening on port ${PORT}`)
})
