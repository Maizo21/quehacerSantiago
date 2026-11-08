const cheerio = require('cheerio');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { GoogleGenAI, Type } = require('@google/genai');
const { prisma } = require('../Models/ideasModels');
const { getSantiagoDateKey, parseDateOnly, todayAsUtcDate, addUtcDays } = require('../lib/dateUtils');

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

const BLOCKED_EVENT_KEYWORDS = Array.from(new Set([
    'nexus',
    ...(process.env.BLOCKED_EVENT_KEYWORDS || '').split(',')
])).map(value => normalize(value)).filter(Boolean);
const MAX_SAME_EVENT_SUGGESTIONS = Math.max(1, Math.min(5, Number(process.env.MAX_SAME_EVENT_SUGGESTIONS) || 2));
const DIRECT_EXTRACTION_SOURCES = new Set([
    'biblioteca-nacional',
    'bibliotecas-providencia',
    'patrimonio-cultural',
    'hoy-jugue'
]);

const SOURCES = [
    { id: 'biblioteca-santiago', nombre: 'Biblioteca de Santiago', tipo: 'WEB', url: 'https://www.bibliotecasantiago.gob.cl/cartelera/proximos' },
    { id: 'biblioteca-nacional', nombre: 'Biblioteca Nacional', tipo: 'WEB', url: 'https://www.bibliotecanacional.gob.cl/cartelera' },
    { id: 'bibliotecas-providencia', nombre: 'Bibliotecas de Providencia', tipo: 'WEB', url: 'https://biblioteca.providencia.cl/provi/site/edic/base/port/inicio.html' },
    { id: 'patrimonio-cultural', nombre: 'Cartelera de Patrimonio Cultural', tipo: 'WEB', url: 'https://www.bibliotecanacional.gob.cl/cartelera/red-nacional?region=RM' },
    { id: 'visit-santiago', nombre: 'Visit Santiago', tipo: 'WEB', url: 'https://visitsantiago.travel/panoramas/' },
    { id: 'cclm', nombre: 'Centro Cultural La Moneda', tipo: 'WEB', url: 'https://www.cclm.cl/' },
    { id: 'gam', nombre: 'GAM', tipo: 'WEB', url: 'https://gam.cl/es/calendario/' },
    { id: 'la-tercera-finde', nombre: 'La Tercera Finde', tipo: 'RSS', url: 'https://www.latercera.com/arcio/rss/' },
    { id: 'camara-libro', nombre: 'Cámara Chilena del Libro y FILSA', tipo: 'WEB', url: 'https://camaradellibro.cl/' },
    { id: 'hoy-jugue', nombre: 'Hoy Jugué · ferias y juegos', tipo: 'WEB', url: 'https://hoyjugue.cl/agenda/' },
    { id: 'mesa-1', nombre: 'Mesa 1', tipo: 'WEB', url: 'https://www.mesa1.cl/pages/events' },
    { id: 'bastion-goblin', nombre: 'Bastión Goblin', tipo: 'WEB', url: 'https://bastiongoblin.com/pages/torneos' },
    { id: 'area-52', nombre: 'Área 52', tipo: 'WEB', url: 'https://area52.cl/collections/eventos' },
    { id: 'enroque', nombre: 'Enroque Juegos de Mesa', tipo: 'WEB', url: 'https://juegosenroque.cl/' },
    { id: 'magicsur', nombre: 'MagicSur · torneos de cartas', tipo: 'WEB', url: 'https://www.cartasmagicsur.cl/torneos' }
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

function eventFamilyKey(value) {
    const withoutVenue = clean(value, 300)
        .replace(/\s+(?:en|@)\s+[^|]+$/i, '')
        .replace(/\s*[|]\s*[^|]+$/i, '')
        .trim();
    return normalize(withoutVenue);
}

function isBlockedEvent(event) {
    const haystack = normalize(`${event?.titulo || event?.title || ''} ${event?.descripcion || event?.description || ''}`);
    return BLOCKED_EVENT_KEYWORDS.some(keyword => haystack.includes(keyword));
}

function isRetryableAiError(error) {
    const message = String(error?.message || error || '').toLowerCase();
    return /\b429\b|\b503\b|unavailable|high demand|resource_exhausted|temporar/.test(message);
}

function friendlySourceError(error) {
    const message = String(error?.message || error || 'Error desconocido');
    if (isRetryableAiError(error)) return 'Gemini está temporalmente saturado. Intenta nuevamente en unos minutos.';
    if (error?.name === 'AbortError') return 'La fuente tardó más de 12 segundos en responder.';
    if (/fetch failed/i.test(message)) return 'No se pudo conectar con la fuente.';
    const http = message.match(/HTTP\s+(\d{3})/i);
    if (http) return `La fuente respondió con error ${http[1]}.`;
    return clean(message, 240) || 'Error desconocido';
}

async function generateWithRetry(request, maxAttempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await ai.models.generateContent(request);
        } catch (error) {
            lastError = error;
            if (!isRetryableAiError(error) || attempt === maxAttempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 750 * (2 ** (attempt - 1))));
        }
    }
    throw lastError;
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

const SPANISH_MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function currentProvidenciaUrl() {
    const [year, month] = getSantiagoDateKey().split('-');
    return `https://biblioteca.providencia.cl/provi/${year}-actividades-de-${SPANISH_MONTHS[Number(month) - 1]}`;
}

async function fetchSource(source) {
    const urls = source.id === 'bibliotecas-providencia'
        ? [currentProvidenciaUrl(), source.url]
        : [source.url];
    let lastError;
    for (const url of urls) {
        try {
            return { html: await fetchText(url), url };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}

function parseSpanishDate(text, fallbackYear = Number(getSantiagoDateKey().slice(0, 4))) {
    const value = normalize(text);
    const monthPattern = SPANISH_MONTHS.join('|');
    const match = value.match(new RegExp(`(?:^|\\s)(\\d{1,2})\\s+de\\s+(${monthPattern})(?:\\s+de\\s+(20\\d{2}))?`));
    if (!match) return null;
    const month = SPANISH_MONTHS.indexOf(match[2]) + 1;
    const year = Number(match[3] || fallbackYear);
    return parseDateOnly(`${year}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`);
}

function parseHeritageDate(value) {
    const iso = parseDateOnly(value);
    if (iso) return iso;
    const text = normalize(value);
    const match = text.match(new RegExp(`(\\d{1,2})\\s+(${SPANISH_MONTHS.join('|')})\\s+(20\\d{2})`));
    if (!match) return null;
    const month = SPANISH_MONTHS.indexOf(match[2]) + 1;
    return parseDateOnly(`${match[3]}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`);
}

function eventPrice(text) {
    const value = clean(text, 500);
    if (/gratis|gratuita|entrada liberada|sin costo/i.test(value)) {
        return { precio: 0, precioEstado: 'GRATIS' };
    }
    const match = value.match(/\$\s*([\d.]+)/);
    const amount = match ? Number(match[1].replace(/\./g, '')) : 0;
    return amount > 0
        ? { precio: amount, precioEstado: 'PAGADO' }
        : { precio: 0, precioEstado: 'NO_INFORMADO' };
}

function inferredTags(text, defaults = ['cultural']) {
    const value = normalize(text);
    const tags = new Set(defaults);
    if (/juego|ludic|ajedrez|catan|rol\b/.test(value)) tags.add('juegos');
    if (/carta|tcg|pokemon|magic|yu gi oh/.test(value)) tags.add('cartas');
    if (/libro|lectura|literar|cuento|comic|poesia|editorial/.test(value)) tags.add('libros');
    if (/gratis|gratuita|entrada liberada/.test(value)) tags.add('gratis');
    if (/famil|infantil|nino|nina/.test(value)) tags.add('familiar');
    return Array.from(tags).slice(0, 5);
}

function isProvidenciaCultureEvent(title, location) {
    const value = normalize(`${title} ${location}`);
    return /biblioteca|cafe literario|montecarmelo|libro|lectura|cuento|poesia|comic|ajedrez|videojuego|juego de mesa|feria|festival|cine|teatro|exposicion|museo|patrimonio|arte|ilustrad|encuadernacion|ghibli/.test(value);
}

function inAllowedWindow(event, maxDate) {
    return Boolean(event.fecha && event.fecha <= maxDate && (event.fechaFin || event.fecha) >= todayAsUtcDate());
}

function uniqueUpcomingEvents(events, limit = 20) {
    const seen = new Set();
    const unique = events
        .sort((a, b) => a.fecha - b.fecha || b.confianza - a.confianza)
        .filter(event => {
            const key = `${normalize(event.titulo)}|${event.fecha.toISOString().slice(0, 10)}|${normalize(event.ubicacion)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    const today = todayAsUtcDate();
    const buckets = [[], [], []];
    for (const event of unique) {
        const effectiveDate = event.fecha < today && event.fechaFin >= today ? today : event.fecha;
        const daysAway = Math.floor((effectiveDate - today) / 86400000);
        buckets[daysAway <= 7 ? 0 : daysAway <= 14 ? 1 : 2].push(event);
    }
    const selected = [
        ...buckets[0].slice(0, 8),
        ...buckets[1].slice(0, 6),
        ...buckets[2].slice(0, 6)
    ];
    if (selected.length < limit) {
        const selectedSet = new Set(selected);
        selected.push(...unique.filter(event => !selectedSet.has(event)).slice(0, limit - selected.length));
    }
    return selected.sort((a, b) => a.fecha - b.fecha).slice(0, limit);
}

function extractHeritageEvents(html, source, maxDate) {
    const $ = cheerio.load(html);
    const events = [];
    $('.node--evento, .views-row').each((_, element) => {
        const card = $(element);
        const link = card.find('h2 a').first();
        const titulo = clean(link.text(), 200);
        const dateNodes = card.find('.field--name-field-fechas time');
        const fecha = parseHeritageDate(dateNodes.first().attr('datetime') || dateNodes.first().text());
        const fechaFin = parseHeritageDate(dateNodes.eq(1).attr('datetime') || dateNodes.eq(1).text());
        const ubicacion = clean(card.find('.field--name-field-direccion').first().text(), 200) || 'Santiago';
        if (!titulo || !fecha) return;
        if (source.id === 'patrimonio-cultural' && !/santiago|recoleta|quinta normal/i.test(ubicacion)) return;
        const event = {
            titulo,
            descripcion: clean(card.find('.field--name-field-tipo-evento, .field--name-field-tematica').first().text(), 500),
            ubicacion,
            fecha,
            fechaFin,
            precio: 0,
            precioEstado: source.id === 'biblioteca-nacional' ? 'GRATIS' : 'NO_INFORMADO',
            imagenUrl: safeExternalUrl(card.find('img').first().attr('src'), null),
            fuenteUrl: safeExternalUrl(link.attr('href'), source.url),
            tags: inferredTags(`${titulo} ${card.text()}`, source.id === 'biblioteca-nacional' ? ['libros', 'cultural', 'gratis'] : ['cultural']),
            confianza: 95,
            advertencias: null
        };
        if (inAllowedWindow(event, maxDate)) events.push(event);
    });
    return events;
}

function extractProvidenciaEvents(html, source, maxDate) {
    const $ = cheerio.load(html);
    const year = Number(getSantiagoDateKey().slice(0, 4));
    const events = [];
    $('table tr').each((_, row) => {
        const cells = $(row).children('td');
        if (cells.length < 3) return;
        const dateText = clean(cells.eq(0).text(), 200);
        const details = clean(cells.eq(1).text(), 1000);
        const fecha = parseSpanishDate(dateText, year);
        const titulo = clean(details.split(/inscripciones|gratuita|más info|previa inscripción|valor sujeto/i)[0], 200)
            .replace(/^["“”]+|["“”]+$/g, '')
            .trim();
        if (!fecha || !titulo) return;
        const price = eventPrice(details);
        const ubicacion = clean(cells.eq(2).text(), 200) || 'Providencia, Santiago';
        if (!isProvidenciaCultureEvent(titulo, ubicacion)) return;
        const event = {
            titulo,
            descripcion: details,
            ubicacion,
            fecha,
            fechaFin: null,
            ...price,
            imagenUrl: null,
            fuenteUrl: safeExternalUrl(cells.eq(1).find('a[href]').first().attr('href'), source.url),
            tags: inferredTags(`${titulo} ${details}`, ['cultural']),
            confianza: 92,
            advertencias: null
        };
        if (inAllowedWindow(event, maxDate)) events.push(event);
    });
    return events;
}

function extractHoyJuegueEvents(html, source, maxDate) {
    const $ = cheerio.load(html);
    const events = [];
    $('article.hja-overview-card').each((_, element) => {
        const card = $(element);
        const link = card.find('h3 a').first();
        const titulo = clean(link.text(), 200);
        const fecha = parseDateOnly(card.find('time[datetime]').first().attr('datetime'));
        const ubicacion = clean(card.find('.hja-overview-card__location').text(), 200);
        if (!titulo || !fecha || !/santiago/i.test(ubicacion)) return;
        const priceText = clean(card.find('.hja-overview-card__price').text(), 500);
        const event = {
            titulo,
            descripcion: priceText,
            ubicacion,
            fecha,
            fechaFin: null,
            ...eventPrice(priceText),
            imagenUrl: safeExternalUrl(card.find('img').first().attr('src'), null),
            fuenteUrl: safeExternalUrl(link.attr('href'), source.url),
            tags: inferredTags(`${titulo} ${priceText}`, ['juegos']),
            confianza: 96,
            advertencias: null
        };
        if (inAllowedWindow(event, maxDate)) events.push(event);
    });
    return events;
}

function extractDirectEvents(html, source, maxDate) {
    let events = [];
    if (source.id === 'biblioteca-nacional' || source.id === 'patrimonio-cultural') {
        events = extractHeritageEvents(html, source, maxDate);
    } else if (source.id === 'bibliotecas-providencia') {
        events = extractProvidenciaEvents(html, source, maxDate);
    } else if (source.id === 'hoy-jugue') {
        events = extractHoyJuegueEvents(html, source, maxDate);
    }
    return uniqueUpcomingEvents(events);
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
- No incluyas eventos relacionados con: ${BLOCKED_EVENT_KEYWORDS.join(', ')}.
- Si el mismo juego o evento aparece en varios locales, entrega como máximo ${MAX_SAME_EVENT_SUGGESTIONS} alternativas.
- Máximo 20 eventos.

CONTENIDO:
${text}`;

    const result = await generateWithRetry({
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
    })).filter(item => item.titulo && !isBlockedEvent(item) && item.fecha && item.fecha <= maxDate && (item.fechaFin || item.fecha) >= todayAsUtcDate());
}

async function persistEvents(events, source) {
    let created = 0;
    for (const event of events) {
        if (isBlockedEvent(event)) continue;
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
        const fetched = await fetchSource(source);
        const extractionSource = { ...source, url: fetched.url };
        const html = fetched.html;
        const maxDate = addUtcDays(todayAsUtcDate(), 45);
        const direct = extractDirectEvents(html, extractionSource, maxDate);
        const structured = extractJsonLdEvents(html, extractionSource, maxDate);
        let aiEvents = [];
        let aiError = null;
        if (!DIRECT_EXTRACTION_SOURCES.has(source.id) || direct.length === 0) {
            try {
                aiEvents = await extractWithAi(html, extractionSource, maxDate);
            } catch (error) {
                aiError = error;
            }
        }
        const all = [...direct, ...structured, ...aiEvents];
        if (aiError && all.length === 0) throw aiError;
        const created = await persistEvents(all, source);
        const status = aiError ? 'PARCIAL' : 'OK';
        const warning = aiError ? friendlySourceError(aiError) : null;
        await prisma.discoverySource.update({
            where: { id: source.id },
            data: { ultimoEstado: status, ultimoError: warning }
        });
        return { sourceId: source.id, nombre: source.nombre, encontrados: all.length, nuevos: created, estado: status, error: warning };
    } catch (error) {
        const message = friendlySourceError(error);
        await prisma.discoverySource.update({
            where: { id: source.id },
            data: { ultimoEstado: 'ERROR', ultimoError: message }
        }).catch(() => {});
        return { sourceId: source.id, nombre: source.nombre, encontrados: 0, nuevos: 0, estado: 'ERROR', error: message };
    }
}

module.exports = {
    SOURCES,
    BLOCKED_EVENT_KEYWORDS,
    MAX_SAME_EVENT_SUGGESTIONS,
    eventFamilyKey,
    isBlockedEvent,
    friendlySourceError,
    extractDirectEvents,
    runSource
};
