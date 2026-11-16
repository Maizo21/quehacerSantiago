const sanitizeHtml = require('sanitize-html');
const { prisma } = require('../Models/ideasModels');
const {
    SOURCES,
    MAX_SAME_EVENT_SUGGESTIONS,
    DISCOVERY_AI_FALLBACK_ENABLED,
    MAX_AI_SOURCES_PER_RUN,
    fingerprint,
    eventFamilyKey,
    isBlockedEvent,
    runSource
} = require('../services/discoverySources');
const { parseDateOnly, todayAsUtcDate } = require('../lib/dateUtils');

const clean = value => sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim();

function serializeSuggestion(item) {
    return {
        ...item,
        fecha: item.fecha?.toISOString().slice(0, 10),
        fechaFin: item.fechaFin?.toISOString().slice(0, 10) || null
    };
}

function safeHttpUrl(value) {
    try {
        const url = new URL(String(value || ''));
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

exports.getSources = async (req, res) => {
    res.json(SOURCES);
};
exports.runDiscovery = async (req, res) => {
    if (!/^(1|true|yes)$/i.test(process.env.DISCOVERY_SERVER_SCRAPING_ENABLED || 'false')) {
        return res.status(410).json({
            Error: 'El scraping del servidor está desactivado. Usa el recolector local del navegador.'
        });
    }
    const requested = Array.isArray(req.body.sourceIds) ? req.body.sourceIds.map(clean) : [];
    const selected = requested.length > 0
        ? SOURCES.filter(source => requested.includes(source.id))
        : SOURCES;
    if (selected.length === 0) return res.status(400).json({ Error: 'No se seleccionaron fuentes válidas' });
    if (selected.length > 30) return res.status(400).json({ Error: 'Máximo 30 fuentes por búsqueda' });

    const results = [];
    const aiBudget = {
        remaining: DISCOVERY_AI_FALLBACK_ENABLED ? MAX_AI_SOURCES_PER_RUN : 0,
        used: 0
    };
    for (const source of selected) {
        results.push(await runSource(source, { aiBudget }));
    }
    const familyCounts = new Map();
    const seen = new Set();
    const suggestions = [];
    for (const result of results) {
        for (const event of result.events || []) {
            if (isBlockedEvent(event)) continue;
            const key = fingerprint(event);
            const family = eventFamilyKey(event.titulo);
            const familyCount = familyCounts.get(family) || 0;
            if (seen.has(key) || familyCount >= MAX_SAME_EVENT_SUGGESTIONS) continue;
            seen.add(key);
            familyCounts.set(family, familyCount + 1);
            suggestions.push(serializeSuggestion({
                ...event,
                id: key,
                fingerprint: key,
                fuenteId: result.sourceId,
                fuenteNombre: result.nombre
            }));
        }
    }
    const resultSummary = results.map(({ events, ...result }) => result);
    res.json({
        resultados: resultSummary,
        suggestions,
        nuevos: suggestions.length,
        iaUsos: aiBudget.used,
        iaNoDisponible: results.filter(item => item.iaNoDisponible).length,
        modoAhorro: true,
        servicioIa: Boolean(process.env.GEMINI_API_KEY),
        respaldoIaHabilitado: DISCOVERY_AI_FALLBACK_ENABLED
    });
};

exports.approveLocalSuggestion = async (req, res) => {
    const fecha = parseDateOnly(req.body.fecha);
    const fechaFin = parseDateOnly(req.body.fechaFin);
    const suggestion = {
        titulo: clean(req.body.titulo).slice(0, 200),
        descripcion: clean(req.body.descripcion).slice(0, 1000) || null,
        ubicacion: clean(req.body.ubicacion).slice(0, 200) || 'Santiago',
        fecha,
        fechaFin,
        precio: Math.max(0, Math.round(Number(req.body.precio) || 0)),
        precioEstado: ['GRATIS', 'PAGADO', 'NO_INFORMADO'].includes(req.body.precioEstado)
            ? req.body.precioEstado
            : 'NO_INFORMADO',
        imagenUrl: safeHttpUrl(req.body.imagenUrl),
        fuenteNombre: clean(req.body.fuenteNombre).slice(0, 120) || 'Descubrimiento automático',
        fuenteUrl: safeHttpUrl(req.body.fuenteUrl),
        tags: Array.from(new Set(
            (Array.isArray(req.body.tags) ? req.body.tags : [])
                .map(tag => clean(tag).toLowerCase().slice(0, 30))
                .filter(Boolean)
        )).slice(0, 5)
    };
    if (!suggestion.titulo || !suggestion.fecha || !suggestion.fuenteUrl) {
        return res.status(400).json({ Error: 'La sugerencia no contiene título, fecha o fuente válidos' });
    }
    if ((suggestion.fechaFin || suggestion.fecha) < todayAsUtcDate()) {
        return res.status(400).json({ Error: 'El evento ya finalizó' });
    }
    if (suggestion.fechaFin && suggestion.fechaFin < suggestion.fecha) {
        return res.status(400).json({ Error: 'El rango de fechas no es válido' });
    }
    if (isBlockedEvent(suggestion)) {
        return res.status(400).json({ Error: 'El evento está excluido de las sugerencias' });
    }
    const externalKey = fingerprint(suggestion);
    const existing = await prisma.idea.findFirst({ where: { externalKey } });
    if (existing) return res.status(200).json(existing);

    const tagNames = suggestion.tags.length > 0 ? suggestion.tags : ['panorama'];
    const idea = await prisma.$transaction(async tx => {
        const tagRecords = await Promise.all(tagNames.map(nombre => tx.tag.upsert({
            where: { nombre },
            update: {},
            create: { nombre }
        })));
        return tx.idea.create({
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
                externalKey,
                creadoPor: req.userName || req.userEmail,
                tags: { create: tagRecords.map(tag => ({ tagId: tag.id })) }
            }
        });
    });
    res.status(201).json(idea);
};
