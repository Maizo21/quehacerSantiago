const { GoogleGenAI, Type } = require('@google/genai');
const sanitizeHtml = require('sanitize-html');
const { prisma } = require('../Models/ideasModels');

const clean = (str) => str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

// Límite diario por usuario (anti-abuso)
const MAX_AI_REQUESTS_PER_DAY = 30;

const SCHEMA = {
    type: Type.OBJECT,
    properties: {
        sugerencias: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    titulo: { type: Type.STRING },
                    descripcion: { type: Type.STRING },
                    distancia: { type: Type.STRING }
                },
                required: ['titulo', 'descripcion', 'distancia']
            }
        }
    },
    required: ['sugerencias']
};

// POST /sugerencias — sugerencias de planes cercanos con IA
exports.getSuggestions = async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ Error: 'Servicio de IA no configurado' });
        }

        const { ubicacion, excluir } = req.body;

        if (!ubicacion || typeof ubicacion !== 'string') {
            return res.status(400).json({ Error: 'Ubicación requerida' });
        }

        const ubi = clean(ubicacion).slice(0, 200);
        const exc = excluir && typeof excluir === 'string' ? clean(excluir).slice(0, 200) : '';

        if (!ubi) {
            return res.status(400).json({ Error: 'Ubicación inválida' });
        }

        // Límite diario por usuario
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayCount = await prisma.aIUsageLog.count({
            where: {
                userId: req.userId,
                createdAt: { gte: startOfDay }
            }
        });

        if (todayCount >= MAX_AI_REQUESTS_PER_DAY) {
            return res.status(429).json({
                Error: `Alcanzaste el límite diario de ${MAX_AI_REQUESTS_PER_DAY} sugerencias. Intenta mañana.`
            });
        }

        const prompt = `Sugiere exactamente 5 planes o actividades reales para hacer cerca de "${ubi}" en Santiago de Chile.
${exc ? `NO incluyas ni sugieras este plan: "${exc}".` : ''}

Para cada sugerencia entrega:
- titulo: nombre breve y atractivo del plan (máx 60 caracteres)
- descripcion: descripción corta que motive a hacerlo (máx 150 caracteres)
- distancia: distancia aproximada o tiempo desde "${ubi}" (ej: "5 min caminando", "2 km en auto")

Usa SOLO lugares y actividades reales y conocidos en Santiago de Chile. Varía entre gastronomía, naturaleza, cultura, compras y aire libre. No inventes lugares.`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: SCHEMA,
                temperature: 0.9
            }
        });

        const parsed = JSON.parse(result.text);

        if (!parsed.sugerencias || !Array.isArray(parsed.sugerencias)) {
            return res.status(502).json({ Error: 'Respuesta inválida del servicio de IA' });
        }

        // Log solo en éxito (no penalizamos al usuario por errores del servicio)
        await prisma.aIUsageLog.create({
            data: {
                userId: req.userId,
                userEmail: req.userEmail || null
            }
        }).catch(err => console.error('Error logging AI usage:', err.message));

        res.status(200).json(parsed);
    } catch (err) {
        console.error('Error en getSuggestions:', err.message);
        res.status(500).json({ Error: 'Error al generar sugerencias' });
    }
};

// GET /admin/ai-usage?days=7 — ranking de uso de IA por usuario
exports.getUsageStats = async (req, res) => {
    try {
        const days = Math.max(1, Math.min(90, parseInt(req.query.days) || 7));
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const logs = await prisma.aIUsageLog.groupBy({
            by: ['userId', 'userEmail'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });

        const total = logs.reduce((sum, l) => sum + l._count.id, 0);

        const ranking = logs.map(l => ({
            userId: l.userId,
            userEmail: l.userEmail,
            count: l._count.id
        }));

        res.status(200).json({
            days,
            since: since.toISOString(),
            total,
            dailyLimitPerUser: MAX_AI_REQUESTS_PER_DAY,
            ranking
        });
    } catch (err) {
        console.error('Error en getUsageStats:', err.message);
        res.status(500).json({ Error: 'Error al obtener estadísticas' });
    }
};
