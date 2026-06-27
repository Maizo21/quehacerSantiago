const cheerio = require('cheerio');
const dns = require('dns').promises;
const sanitizeHtml = require('sanitize-html');
const { GoogleGenAI, Type } = require('@google/genai');

const clean = (str) => str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

const FETCH_TIMEOUT_MS = 10000;
const MAX_HTML_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const USER_AGENT = 'QueHacerSantiagoBot/1.0 (+https://quehacer-santiago.vercel.app)';

const SCHEMA = {
    type: Type.OBJECT,
    properties: {
        titulo: { type: Type.STRING },
        descripcion: { type: Type.STRING },
        ubicacion: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['titulo']
};

function isPrivateIp(ip) {
    if (!ip) return true;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;
    if (ip.startsWith('169.254.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
    const lower = ip.toLowerCase();
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80:')) return true;
    return false;
}

async function safeFetch(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('INVALID_URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('INVALID_PROTOCOL');
    }

    const { address } = await dns.lookup(parsed.hostname);
    if (isPrivateIp(address)) {
        throw new Error('PRIVATE_ADDRESS');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8' },
            redirect: 'follow'
        });
    } finally {
        clearTimeout(timeout);
    }
}

// POST /importar-url — importar metadatos de una URL con IA
exports.importFromUrl = async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ Error: 'Servicio de IA no configurado' });
        }

        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ Error: 'URL requerida' });
        }

        let html;
        try {
            const response = await safeFetch(url);
            if (!response.ok) {
                return res.status(502).json({ Error: `La página respondió ${response.status}` });
            }
            const contentLength = response.headers.get('content-length');
            if (contentLength && Number(contentLength) > MAX_HTML_SIZE) {
                return res.status(413).json({ Error: 'La página es demasiado grande' });
            }
            html = await response.text();
            if (html.length > MAX_HTML_SIZE) {
                return res.status(413).json({ Error: 'La página es demasiado grande' });
            }
        } catch (e) {
            if (e.message === 'INVALID_URL') return res.status(400).json({ Error: 'URL inválida' });
            if (e.message === 'INVALID_PROTOCOL') return res.status(400).json({ Error: 'Solo se aceptan URLs http/https' });
            if (e.message === 'PRIVATE_ADDRESS') return res.status(400).json({ Error: 'No se puede importar desde direcciones internas' });
            if (e.name === 'AbortError') return res.status(504).json({ Error: 'La página tardó demasiado en responder' });
            console.error('Fetch error en importFromUrl:', e.message);
            return res.status(502).json({ Error: 'No se pudo acceder a la página' });
        }

        const $ = cheerio.load(html);
        const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').first().text();
        const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        const ogSiteName = $('meta[property="og:site_name"]').attr('content');

        $('script, style, noscript, nav, footer, header').remove();
        const bodyText = $('article, main, body').first().text().replace(/\s+/g, ' ').trim().slice(0, 2000);

        if (!ogTitle && !ogDesc && !bodyText) {
            return res.status(422).json({ Error: 'No se pudo extraer información de la página' });
        }

        const prompt = `Te paso el contenido extraído de una página web. Tu tarea es extraer datos para crear un "plan" o "actividad" en Santiago de Chile.

Si la página NO trata sobre un plan, lugar o actividad físico en Santiago de Chile (ej: noticia política, deporte mundial, gaming, e-commerce general), devuelve titulo como string vacío "".

CONTENIDO:
- Título: ${ogTitle || ''}
- Descripción: ${ogDesc || ''}
- Sitio: ${ogSiteName || ''}
- URL: ${url}
- Texto: ${bodyText}

Genera JSON:
- titulo: nombre claro y breve del plan o lugar (máx 80 caracteres). Si no aplica, ""
- descripcion: corta y motivante (máx 300 caracteres)
- ubicacion: dirección, barrio o comuna en Santiago de Chile (máx 100 caracteres). Si no la encuentras, ""
- tags: 2 a 4 etiquetas SOLO de esta lista exacta: outdoor, cultural, gastronomía, gratis, con niños, noche, romántico, familiar, pareja, amigos`;

        let geminiResult;
        try {
            geminiResult = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: SCHEMA,
                    temperature: 0.4
                }
            });
        } catch (e) {
            console.error('Gemini error en importFromUrl:', e.message);
            return res.status(502).json({ Error: 'La IA no pudo procesar la página' });
        }

        const rawText = geminiResult?.text;
        if (!rawText || typeof rawText !== 'string') {
            console.error('Gemini empty response en importFromUrl');
            return res.status(502).json({ Error: 'La IA no devolvió respuesta' });
        }

        let parsed;
        try {
            const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error('Parse error en importFromUrl:', e.message, '— raw:', rawText.slice(0, 300));
            return res.status(502).json({ Error: 'La IA devolvió un formato inválido' });
        }

        if (!parsed.titulo) {
            return res.status(422).json({ Error: 'La página no parece tratar sobre un plan en Santiago' });
        }

        let imagenBase64 = null;
        if (ogImage) {
            try {
                const absImageUrl = new URL(ogImage, url).toString();
                const imgResponse = await safeFetch(absImageUrl);
                if (imgResponse.ok) {
                    const contentType = imgResponse.headers.get('content-type') || '';
                    const contentLength = imgResponse.headers.get('content-length');
                    if (contentType.startsWith('image/') && (!contentLength || Number(contentLength) <= MAX_IMAGE_SIZE)) {
                        const buf = Buffer.from(await imgResponse.arrayBuffer());
                        if (buf.length <= MAX_IMAGE_SIZE) {
                            imagenBase64 = `data:${contentType};base64,${buf.toString('base64')}`;
                        }
                    }
                }
            } catch (e) {
                console.error('Image fetch error en importFromUrl:', e.message);
            }
        }

        res.status(200).json({
            titulo: clean(parsed.titulo).slice(0, 80),
            descripcion: clean(parsed.descripcion || '').slice(0, 300),
            ubicacion: clean(parsed.ubicacion || '').slice(0, 100),
            tags: Array.isArray(parsed.tags)
                ? parsed.tags.slice(0, 4).map(t => clean(String(t))).filter(Boolean)
                : [],
            imagenBase64,
            source: new URL(url).hostname
        });
    } catch (err) {
        console.error('Error inesperado en importFromUrl:', err.message);
        res.status(500).json({ Error: 'Error interno al importar' });
    }
};
