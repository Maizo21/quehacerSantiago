const cheerio = require('cheerio');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { GoogleGenAI, Type } = require('@google/genai');
const { prisma } = require('../Models/ideasModels');
const { getSantiagoDateKey, parseDateOnly, todayAsUtcDate, addUtcDays } = require('../lib/dateUtils');

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

const SOURCES = [
    { id: 'biblioteca-santiago', nombre: 'Biblioteca de Santiago', tipo: 'WEB', url: 'https://www.bibliotecasantiago.gob.cl/cartelera/proximos' },
    { id: 'visit-santiago', nombre: 'Visit Santiago', tipo: 'WEB', url: 'https://visitsantiago.travel/panoramas/' },
    { id: 'cclm', nombre: 'Centro Cultural La Moneda', tipo: 'WEB', url: 'https://www.cclm.cl/' },
    { id: 'gam', nombre: 'GAM', tipo: 'WEB', url: 'https://gam.cl/es/' },
    { id: 'la-tercera-finde', nombre: 'La Tercera Finde', tipo: 'RSS', url: 'https://www.latercera.com/arcio/rss/' },
    { id: 'la-tercera-stories', nombre: 'La Tercera Stories', tipo: 'WEB', url: 'https://stories.latercera.com/' },
    { id: 'mesa-1', nombre: 'Mesa 1', tipo: 'WEB', url: 'https://www.mesa1.cl/pages/events' },
    { id: 'bastion-goblin', nombre: 'Bastión Goblin', tipo: 'WEB', url: 'https://bastiongoblin.com/pages/torneos' },
    { id: 'area-52', nombre: 'Área 52', tipo: 'WEB', url: 'https://area52.cl/collections/eventos' },
    { id: 'enroque', nombre: 'Enroque Juegos de Mesa', tipo: 'WEB', url: 'https://juegosenroque.cl/' },
    { id: 'shivano', nombre: 'Shivano Store', tipo: 'WEB', url: 'https://shivano.cl/' },
    { id: 'demente-games', nombre: 'Demente Games', tipo: 'WEB', url: 'https://dementegames.cl/' },
    { id: 'instagram-enroque', nombre: 'Instagram · Enroque', tipo: 'INSTAGRAM', url: 'https://www.instagram.com/enroque_juegosdemesa/' },
    { id: 'instagram-demente', nombre: 'Instagram · Demente Games', tipo: 'INSTAGRAM', url: 'https://www.instagram.com/dementegames_cl/' },
    { id: 'entrejuegos', nombre: 'EntreJuegos', tipo: 'WEB', url: 'https://www.entrejuegos.cl/eventos' },
    { id: 'casa-de-juegos', nombre: 'Casa de Juegos', tipo: 'WEB', url: 'https://www.casadejuegos.cl/blogs/noticias' },
    { id: 'freljord', nombre: 'Freljord - tiendas y partidas', tipo: 'WEB', url: 'https://freljord.cl/tiendas' }
];

const AI_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        eventos: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    titulo: { type: Type.STRING },
                    descripcion: { type: Type.STRING },
                    ubicacion: { type: Type.STRING },
                    fecha: { type: Type.STRING },
                    fechaFin: { type: Type.STRING },
                    precio: { type: Type.NUMBER },
                    precioEstado: { type: Type.STRING },
                    url: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confianza: { type: Type.NUMBER },
                    advertencias: { type: Type.STRING }
                },
                required: ['titulo', 'ubicacion', 'fecha', 'precio', 'precioEstado', 'url', 'tags', 'confianza']
            }
        }
    },
    required: ['eventos']
};

function clean(value, max = 1000) {
    return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
}

function normalize(value) {
    return clean(value, 300)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function safeExternalUrl(value, fallback) {
    try {
        const url = new URL(String(value || ''), fallback);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallback;
    } catch {
        return fallback;
    }
}

function fingerprint(event) {
    const raw = `${normalize(event.titulo)}|${event.fecha.toISOString().slice(0, 10)}|${normalize(event.ubicacion)}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
}

async function fetchText(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'QueHacerSantiagoBot/1.0 (+https://quehacer-santiago.vercel.app)',
                'Accept-Language': 'es-CL,es;q=0.9'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > 5 * 1024 * 1024) throw new Error('Respuesta demasiado grande');
        const text = await response.text();
        if (text.length > 5 * 1024 * 1024) throw new Error('Respuesta demasiado grande');
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

function flattenJsonLd(value, output = []) {
    if (Array.isArray(value)) {
        value.forEach(item => flattenJsonLd(item, output));
    } else if (value && typeof value === 'object') {
        if (value['@type'] === 'Event' || (Array.isArray(value['@type']) && value['@type'].includes('Event'))) {
            output.push(value);
        }
        if (value['@graph']) flattenJsonLd(value['@graph'], output);
    }
    return output;
}

function locationFromJsonLd(location) {
    if (!location) return 'Santiago';
    if (typeof location === 'string') return location;
    const address = location.address;
    const addressText = typeof address === 'string'
        ? address
        : [address?.streetAddress, address?.addressLocality, address?.addressRegion].filter(Boolean).join(', ');
    return [location.name, addressText].filter(Boolean).join(', ') || 'Santiago';
}

function priceFromJsonLd(offers) {
    const offer = Array.isArray(offers) ? offers[0] : offers;
    const raw = offer?.lowPrice ?? offer?.price ?? 0;
    const price = Math.max(0, Math.round(Number(raw) || 0));
    if (String(offer?.availability || '').toLowerCase().includes('free') || price === 0 && offer) {
        return { precio: 0, precioEstado: 'GRATIS' };
    }
    return price > 0
        ? { precio: price, precioEstado: 'PAGADO' }
        : { precio: 0, precioEstado: 'NO_INFORMADO' };
}

function extractJsonLdEvents(html, source, maxDate) {
    const $ = cheerio.load(html);
    const events = [];
    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            const json = JSON.parse($(element).text());
            for (const item of flattenJsonLd(json)) {
                const fecha = parseDateOnly(item.startDate);
                const fechaFin = parseDateOnly(item.endDate);
                if (!fecha || fecha > maxDate || (fechaFin || fecha) < todayAsUtcDate()) continue;
                const price = priceFromJsonLd(item.offers);
                events.push({
                    titulo: clean(item.name, 200),
                    descripcion: clean(item.description, 1000),
                    ubicacion: clean(locationFromJsonLd(item.location), 200),
                    fecha,
                    fechaFin,
                    ...price,
                    imagenUrl: safeExternalUrl(Array.isArray(item.image) ? item.image[0] : item.image, null),
                    fuenteUrl: safeExternalUrl(item.url, source.url),
                    tags: ['cultural'],
                    confianza: 90,
                    advertencias: null
                });
            }
        } catch (_) {}
    });
    return events;
}

function pageTextForAi(html, source) {
    if (source.tipo === 'RSS') {
        const $ = cheerio.load(html, { xmlMode: true });
        return $('item').slice(0, 60).map((_, item) => {
            const title = $(item).find('title').first().text();
            const link = $(item).find('link').first().text();
            const description = $(item).find('description').first().text();
            if (!/finde|panorama|gu[ií]a del ocio|qu[eé] hacer/i.test(`${title} ${link} ${description}`)) return '';
            return `${title} | ${link} | ${clean(description, 800)}`;
        }).get().filter(Boolean).join('\n').slice(0, 18000);
    }

    const $ = cheerio.load(html);
    $('script, style, noscript, nav, footer, form').remove();
    const links = $('a[href]').slice(0, 150).map((_, element) => {
        const label = clean($(element).text(), 180);
        if (!label) return '';
        try {
            return `[${label}](${new URL($(element).attr('href'), source.url).toString()})`;
        } catch {
            return '';
        }
    }).get().filter(Boolean).join('\n');
    const body = clean($('main, body').first().text(), 14000);
    return `${body}\nENLACES:\n${links}`.slice(0, 22000);
}

async function extractWithAi(html, source, maxDate) {
    if (!ai) return [];
    const text = pageTextForAi(html, source);
    if (!text) return [];
    const today = getSantiagoDateKey();
    const max = maxDate.toISOString().slice(0, 10);
    const prompt = `Extrae eventos REALES y presenciales en Santiago de Chile desde el contenido de esta fuente: ${source.nombre}.

Rango permitido: ${today} hasta ${max}, ambos inclusive. La fecha de publicación de una noticia NO es la fecha del evento. No inventes fechas, lugares, precios ni URLs. Omite productos, noticias sin evento concreto, eventos pasados y eventos fuera de la Región Metropolitana.

Reglas:
- fecha y fechaFin: YYYY-MM-DD; fechaFin vacía si no existe.
- Si dice gratis/entrada liberada: precio 0 y precioEstado GRATIS.
- Si hay precio: entero CLP y precioEstado PAGADO.
- Si no se informa precio: precio 0 y precioEstado NO_INFORMADO.
- url debe ser el enlace más directo incluido en el contenido; si no hay uno específico usa ${source.url}.
- tags: 2 a 5 de: juegos, cartas, rol, cultural, arte, libros, musica, outdoor, gratis, familiar, pareja, amigos, gastronomia, deporte, noche.
- confianza: entero 0-100. Menos de 65 si algún dato importante es ambiguo.
- Máximo 20 eventos.

CONTENIDO:
${text}`;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: AI_SCHEMA,
            temperature: 0.1
        }
    });
    const raw = result?.text;
    if (!raw) return [];
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim());
    return (parsed.eventos || []).map(item => ({
        titulo: clean(item.titulo, 200),
        descripcion: clean(item.descripcion, 1000),
        ubicacion: clean(item.ubicacion || 'Santiago', 200),
        fecha: parseDateOnly(item.fecha),
        fechaFin: parseDateOnly(item.fechaFin),
        precio: Math.max(0, Math.round(Number(item.precio) || 0)),
        precioEstado: ['GRATIS', 'PAGADO', 'NO_INFORMADO'].includes(item.precioEstado) ? item.precioEstado : 'NO_INFORMADO',
        imagenUrl: null,
        fuenteUrl: safeExternalUrl(item.url, source.url),
        tags: Array.isArray(item.tags) ? item.tags.map(tag => clean(tag, 30).toLowerCase()).filter(Boolean).slice(0, 5) : [],
        confianza: Math.max(0, Math.min(100, Math.round(Number(item.confianza) || 50))),
        advertencias: clean(item.advertencias, 500) || null
    })).filter(item => item.titulo && item.fecha && item.fecha <= maxDate && (item.fechaFin || item.fecha) >= todayAsUtcDate());
}

async function persistEvents(events, source) {
    let created = 0;
    for (const event of events) {
        const key = fingerprint(event);
        const existingIdea = await prisma.idea.findFirst({ where: { externalKey: key }, select: { id: true } });
        if (existingIdea) continue;
        const existing = await prisma.planSuggestion.findUnique({ where: { fingerprint: key }, select: { id: true } });
        await prisma.planSuggestion.upsert({
            where: { fingerprint: key },
            create: {
                fingerprint: key,
                titulo: event.titulo,
                descripcion: event.descripcion || null,
                ubicacion: event.ubicacion || 'Santiago',
                fecha: event.fecha,
                fechaFin: event.fechaFin || null,
                precio: event.precio,
                precioEstado: event.precioEstado,
                imagenUrl: event.imagenUrl || null,
                fuenteId: source.id,
                fuenteNombre: source.nombre,
                fuenteUrl: event.fuenteUrl || source.url,
                tags: event.tags,
                confianza: event.confianza,
                advertencias: event.advertencias || null
            },
            update: {
                descripcion: event.descripcion || null,
                ubicacion: event.ubicacion || 'Santiago',
                fechaFin: event.fechaFin || null,
                precio: event.precio,
                precioEstado: event.precioEstado,
                fuenteUrl: event.fuenteUrl || source.url,
                tags: event.tags,
                confianza: event.confianza,
                advertencias: event.advertencias || null
            }
        });
        if (!existing) created += 1;
    }
    return created;
}

async function runSource(source) {
    const startedAt = new Date();
    await prisma.discoverySource.upsert({
        where: { id: source.id },
        create: { ...source, ultimaEjecucion: startedAt, ultimoEstado: 'EJECUTANDO' },
        update: { nombre: source.nombre, url: source.url, tipo: source.tipo, ultimaEjecucion: startedAt, ultimoEstado: 'EJECUTANDO', ultimoError: null }
    });
    try {
        const html = await fetchText(source.url);
        const maxDate = addUtcDays(todayAsUtcDate(), 45);
        const structured = extractJsonLdEvents(html, source, maxDate);
        const aiEvents = await extractWithAi(html, source, maxDate);
        const all = [...structured, ...aiEvents];
        const created = await persistEvents(all, source);
        await prisma.discoverySource.update({
            where: { id: source.id },
            data: { ultimoEstado: 'OK', ultimoError: null }
        });
        return { sourceId: source.id, nombre: source.nombre, encontrados: all.length, nuevos: created, estado: 'OK' };
    } catch (error) {
        const message = clean(error.message, 400) || 'Error desconocido';
        await prisma.discoverySource.update({
            where: { id: source.id },
            data: { ultimoEstado: 'ERROR', ultimoError: message }
        }).catch(() => {});
        return { sourceId: source.id, nombre: source.nombre, encontrados: 0, nuevos: 0, estado: 'ERROR', error: message };
    }
}

module.exports = { SOURCES, runSource };
