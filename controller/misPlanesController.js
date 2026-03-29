const sanitizeHtml = require('sanitize-html');
const { prisma } = require('../Models/ideasModels');

const clean = (str) => str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const fileToBase64 = (file) => {
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
};

// Validar formato UUID
const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Límite de planes realizados por usuario (anti-abuso)
const MAX_PLANS_PER_USER = 500;

// POST /mis-planes — marcar plan como realizado
exports.markDone = async (req, res) => {
    try {
        const { ideaId, fecha, nota } = req.body;

        if (!ideaId || !fecha) {
            return res.status(400).json({ Error: 'Faltan datos (ideaId, fecha)' });
        }

        if (!isValidUUID(ideaId)) {
            return res.status(400).json({ Error: 'ID de plan inválido' });
        }

        if (isNaN(new Date(fecha).getTime())) {
            return res.status(400).json({ Error: 'Fecha inválida' });
        }

        if (nota && nota.length > 500) {
            return res.status(400).json({ Error: 'La nota no puede superar los 500 caracteres' });
        }

        // Límite anti-abuso
        const userCount = await prisma.planRealizado.count({ where: { userId: req.userId } });
        if (userCount >= MAX_PLANS_PER_USER) {
            return res.status(429).json({ Error: 'Has alcanzado el límite de planes registrados' });
        }

        const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
        if (!idea) {
            return res.status(404).json({ Error: 'Plan no encontrado' });
        }

        // Verificar si ya lo marcó
        const existing = await prisma.planRealizado.findUnique({
            where: { userId_ideaId: { userId: req.userId, ideaId } }
        });

        if (existing) {
            return res.status(409).json({ Error: 'Ya marcaste este plan como realizado' });
        }

        const record = await prisma.planRealizado.create({
            data: {
                userId: req.userId,
                ideaId,
                fecha: new Date(fecha),
                foto: req.file ? fileToBase64(req.file) : null,
                nota: nota ? clean(nota) : null
            },
            include: { idea: { select: { titulo: true, ubicacion: true } } }
        });

        res.status(201).json(record);
    } catch (err) {
        console.error('Error en markDone:', err.message);
        res.status(500).json({ Error: 'Error interno del servidor' });
    }
};

// GET /mis-planes?year=2026&month=3 — obtener mis planes del mes
exports.getMyPlans = async (req, res) => {
    try {
        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month);

        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({ Error: 'Parámetros year y month requeridos (month 1-12)' });
        }

        if (year < 2020 || year > 2100) {
            return res.status(400).json({ Error: 'Año fuera de rango válido' });
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const plans = await prisma.planRealizado.findMany({
            where: {
                userId: req.userId,
                fecha: { gte: start, lt: end }
            },
            include: {
                idea: {
                    select: { id: true, titulo: true, ubicacion: true, imagenUrl: false }
                }
            },
            orderBy: { fecha: 'asc' }
        });

        res.status(200).json({ plans, total: plans.length });
    } catch (err) {
        console.error('Error en getMyPlans:', err.message);
        res.status(500).json({ Error: 'Error interno del servidor' });
    }
};

// DELETE /mis-planes/:id — desmarcar plan
exports.removeDone = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ Error: 'ID inválido' });
        }

        const record = await prisma.planRealizado.findUnique({ where: { id } });
        if (!record) {
            return res.status(404).json({ Error: 'Registro no encontrado' });
        }

        if (record.userId !== req.userId) {
            return res.status(403).json({ Error: 'No puedes eliminar registros de otro usuario' });
        }

        await prisma.planRealizado.delete({ where: { id } });
        res.status(200).json({ Mensaje: 'Plan desmarcado correctamente' });
    } catch (err) {
        console.error('Error en removeDone:', err.message);
        res.status(500).json({ Error: 'Error interno del servidor' });
    }
};

// GET /mis-planes/check/:ideaId — verificar si ya marqué este plan
exports.checkDone = async (req, res) => {
    try {
        const { ideaId } = req.params;

        if (!isValidUUID(ideaId)) {
            return res.status(400).json({ Error: 'ID de plan inválido' });
        }

        const record = await prisma.planRealizado.findUnique({
            where: { userId_ideaId: { userId: req.userId, ideaId } }
        });

        res.status(200).json({ done: !!record, record: record || null });
    } catch (err) {
        console.error('Error en checkDone:', err.message);
        res.status(500).json({ Error: 'Error interno del servidor' });
    }
};
