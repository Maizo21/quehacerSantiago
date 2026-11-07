const sanitizeHtml = require('sanitize-html');
const { prisma } = require('../Models/ideasModels');
const { SOURCES, runSource } = require('../services/discoverySources');
const { todayAsUtcDate } = require('../lib/dateUtils');

const clean = value => sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim();

function serializeSuggestion(item) {
    return {
        ...item,
        fecha: item.fecha?.toISOString().slice(0, 10),
        fechaFin: item.fechaFin?.toISOString().slice(0, 10) || null
    };
}

exports.getSources = async (req, res) => {
    const records = await prisma.discoverySource.findMany();
    const byId = new Map(records.map(record => [record.id, record]));
    res.json(SOURCES.map(source => ({ ...source, ...(byId.get(source.id) || {}) })));
};

exports.runDiscovery = async (req, res) => {
    const requested = Array.isArray(req.body.sourceIds) ? req.body.sourceIds.map(clean) : [];
    const selected = requested.length > 0
        ? SOURCES.filter(source => requested.includes(source.id))
        : SOURCES;
    if (selected.length === 0) return res.status(400).json({ Error: 'No se seleccionaron fuentes válidas' });
    if (selected.length > 14) return res.status(400).json({ Error: 'Máximo 14 fuentes por búsqueda' });

    const results = [];
    for (const source of selected) {
        results.push(await runSource(source));
    }
    res.json({
        resultados: results,
        nuevos: results.reduce((sum, item) => sum + item.nuevos, 0),
        servicioIa: Boolean(process.env.GEMINI_API_KEY)
    });
};

exports.getSuggestions = async (req, res) => {
    const estado = clean(req.query.estado || 'PENDIENTE').toUpperCase();
    const where = { estado };
    if (estado === 'PENDIENTE') where.fecha = { gte: todayAsUtcDate() };
    const suggestions = await prisma.planSuggestion.findMany({
        where,
        orderBy: [{ fecha: 'asc' }, { confianza: 'desc' }],
        take: 300
    });
    res.json({ suggestions: suggestions.map(serializeSuggestion), total: suggestions.length });
};

exports.approveSuggestion = async (req, res) => {
    const suggestion = await prisma.planSuggestion.findUnique({ where: { id: req.params.id } });
    if (!suggestion) return res.status(404).json({ Error: 'Sugerencia no encontrada' });
    if (suggestion.estado === 'APROBADA' && suggestion.ideaId) {
        return res.status(409).json({ Error: 'La sugerencia ya fue aprobada' });
    }

    const tagNames = suggestion.tags.length > 0 ? suggestion.tags : ['panorama'];
    const result = await prisma.$transaction(async tx => {
        const tagRecords = await Promise.all(tagNames.map(nombre => tx.tag.upsert({
            where: { nombre },
            update: {},
            create: { nombre }
        })));
        const idea = await tx.idea.create({
            data: {
                titulo: suggestion.titulo,
                descripcion: suggestion.descripcion,
                ubicacion: suggestion.ubicacion,
                imagenUrl: suggestion.imagenUrl,
                fecha: suggestion.fecha,
                fechaFin: suggestion.fechaFin,
                precio: suggestion.precio,
                precioEstado: suggestion.precioEstado,
                fuenteNombre: suggestion.fuenteNombre,
                fuenteUrl: suggestion.fuenteUrl,
                externalKey: suggestion.fingerprint,
                creadoPor: req.userName || req.userEmail,
                tags: { create: tagRecords.map(tag => ({ tagId: tag.id })) }
            }
        });
        await tx.planSuggestion.update({
            where: { id: suggestion.id },
            data: { estado: 'APROBADA', ideaId: idea.id }
        });
        return idea;
    });
    res.status(201).json(result);
};

exports.rejectSuggestion = async (req, res) => {
    const suggestion = await prisma.planSuggestion.findUnique({ where: { id: req.params.id } });
    if (!suggestion) return res.status(404).json({ Error: 'Sugerencia no encontrada' });
    await prisma.planSuggestion.update({ where: { id: suggestion.id }, data: { estado: 'RECHAZADA' } });
    res.json({ Mensaje: 'Sugerencia rechazada' });
};
