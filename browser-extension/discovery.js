(function (root) {
  'use strict';

  const CHANNEL = 'quehacer-santiago-local-discovery-v1';
  const SPANISH_MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
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
    { id: 'magicsur', nombre: 'MagicSur · torneos de cartas', tipo: 'WEB', url: 'https://www.cartasmagicsur.cl/torneos' },
    { id: 'torneos-tcg', nombre: 'TorneosTCG · calendario RM', tipo: 'WEB', url: 'https://www.torneostcg.cl/region-metropolitana', extractor: 'DATED_HEADINGS', ubicacion: 'Región Metropolitana', tags: ['cartas', 'juegos'] },
    { id: 'eventhoy-juegos', nombre: 'EventHoy · juegos y gaming', tipo: 'WEB', url: 'https://eventhoy.com/categoria/juegos', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago', tags: ['juegos'] },
    { id: 'collector-center', nombre: 'Collector Center · eventos TCG', tipo: 'WEB', url: 'https://collectorcenter.cl/pages/eventos', extractor: 'DATED_HEADINGS', ubicacion: 'Providencia, Santiago', tags: ['cartas', 'juegos'] },
    { id: 'deck-shield', nombre: 'Deck Shield · eventos TCG', tipo: 'WEB', url: 'https://deckshield.cl/pages/eventos', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago', tags: ['cartas', 'juegos'] },
    { id: 'instituto-italiano', nombre: 'Instituto Italiano · Barrio Italia', tipo: 'WEB', url: 'https://iicsantiago.esteri.it/es/gli_eventi/calendario/', extractor: 'DATED_HEADINGS', ubicacion: 'Providencia, Santiago', tags: ['barrio italia', 'cultural'] },
    { id: 'matucana-100', nombre: 'Matucana 100', tipo: 'WEB', url: 'https://www.m100.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Matucana 100, Estación Central', tags: ['cultural'] },
    { id: 'mnba', nombre: 'Museo Nacional de Bellas Artes', tipo: 'WEB', url: 'https://www.mnba.gob.cl/cartelera', extractor: 'HERITAGE', ubicacion: 'Museo Nacional de Bellas Artes, Santiago', gratis: true, tags: ['arte', 'cultural', 'gratis'] },
    { id: 'mac', nombre: 'Museo de Arte Contemporáneo', tipo: 'WEB', url: 'https://mac.uchile.cl/periodo/actuales/', extractor: 'DATED_HEADINGS', ubicacion: 'Museo de Arte Contemporáneo, Santiago', gratis: true, tags: ['arte', 'cultural', 'gratis'] },
    { id: 'ceina', nombre: 'CEINA · cartelera cultural', tipo: 'WEB', url: 'https://ceina.cl/cartelera/', extractor: 'DATED_HEADINGS', ubicacion: 'CEINA, Arturo Prat 33, Santiago', tags: ['cultural'] },
    { id: 'cultura-las-condes', nombre: 'Corporación Cultural Las Condes', tipo: 'WEB', url: 'https://www.culturallascondes.cl/artes-visuales/', extractor: 'DATED_HEADINGS', ubicacion: 'Las Condes, Santiago', tags: ['arte', 'cultural'] },
    { id: 'municipalidad-santiago', nombre: 'Municipalidad de Santiago · actividades', tipo: 'WEB', url: 'https://www.munistgo.cl/talleres-comunidad/', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago Centro', tags: ['municipal', 'cultural'] },
    { id: 'municipalidad-providencia', nombre: 'Municipalidad de Providencia · actividades', tipo: 'WEB', url: 'https://providencia.cl/provi/site/edic/base/port/inicio.html', extractor: 'PROVIDENCIA', ubicacion: 'Providencia, Santiago', tags: ['municipal', 'cultural'] },
    { id: 'teatro-la-florida', nombre: 'Teatro Municipal de La Florida', tipo: 'WEB', url: 'https://portaldisc.com/eventos/teatromunicipaldelaflorida', extractor: 'DATED_HEADINGS', ubicacion: 'Teatro Municipal de La Florida, La Florida', gratis: true, tags: ['municipal', 'teatro', 'cultural', 'gratis'] },
    { id: 'cultura-nunoa', nombre: 'Corporación Cultural de Ñuñoa', tipo: 'WEB', url: 'https://www.ccn.cl/actividades', extractor: 'DATED_HEADINGS', ubicacion: 'Ñuñoa, Santiago', tags: ['municipal', 'cultural'] },
    { id: 'mallplaza-vespucio', nombre: 'Mallplaza Vespucio · panoramas', tipo: 'WEB', url: 'https://www.mallplaza.com/cl/vespucio/panoramas/index.html', extractor: 'DATED_HEADINGS', ubicacion: 'Mallplaza Vespucio, La Florida', tags: ['mall', 'panorama'] },
    { id: 'parque-arauco', nombre: 'Parque Arauco · eventos', tipo: 'WEB', url: 'https://www.parquearauco.cl/eventos', extractor: 'DATED_HEADINGS', ubicacion: 'Parque Arauco, Las Condes', tags: ['mall', 'panorama'] },
    { id: 'factoria-franklin', nombre: 'Factoría Franklin · agenda', tipo: 'WEB', url: 'https://factoria-franklin.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Factoría Franklin, Santiago', tags: ['barrio franklin', 'ferias', 'cultural'] },
    { id: 'agenda-yungay', nombre: 'Agenda Yungay', tipo: 'WEB', url: 'https://agendayungay.cl/eventos/', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Yungay, Santiago', tags: ['barrio yungay', 'cultural'] },
    { id: 'mavi-uc', nombre: 'MAVI UC · Barrio Lastarria', tipo: 'WEB', url: 'https://mavi.uc.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'MAVI UC, Barrio Lastarria', tags: ['lastarria', 'arte', 'cultural'] },
    { id: 'santiago-turismo', nombre: 'Santiago Turismo · agenda', tipo: 'WEB', url: 'https://www.santiagoturismo.cl/es/agenda/', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago', tags: ['barrios', 'turismo', 'cultural'] },
    { id: 'patio-bellavista', nombre: 'Patio Bellavista · eventos', tipo: 'WEB', url: 'https://patiobellavista.cl/eventos/', extractor: 'DATED_HEADINGS', ubicacion: 'Patio Bellavista, Providencia', tags: ['bellavista', 'cultural'], followEventLinks: true },
    { id: 'barrio-lastarria', nombre: 'Barrio Lastarria · sitio oficial', tipo: 'WEB', url: 'https://barriolastarria.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Lastarria, Santiago', tags: ['lastarria', 'cultural'] },
    { id: 'vive-bellavista', nombre: 'VIVE Santiago · Bellavista', tipo: 'WEB', url: 'https://vivesantiago.cl/barrio-bellavista.html', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Bellavista, Santiago', tags: ['bellavista', 'barrios'] },
    { id: 'vive-lastarria', nombre: 'VIVE Santiago · Lastarria', tipo: 'WEB', url: 'https://vivesantiago.cl/barrio-lastarria.html', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Lastarria, Santiago', tags: ['lastarria', 'barrios'] },
    { id: 'vive-yungay', nombre: 'VIVE Santiago · Yungay', tipo: 'WEB', url: 'https://vivesantiago.cl/barrio-yungay.html', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Yungay, Santiago', tags: ['barrio yungay', 'barrios'] },
    { id: 'vive-brasil', nombre: 'VIVE Santiago · Barrio Brasil', tipo: 'WEB', url: 'https://vivesantiago.cl/barrio-brasil.html', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Brasil, Santiago', tags: ['barrio brasil', 'barrios'] },
    { id: 'club-chocolate', nombre: 'Club Chocolate · Bellavista', tipo: 'WEB', url: 'https://clubchocolate.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Club Chocolate, Barrio Bellavista', tags: ['bellavista', 'música', 'noche'] }
  ];

  const LOOSE_MONTHS = {
    ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4,
    may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8,
    sep: 9, sept: 9, septiembre: 9, setiembre: 9, oct: 10, octubre: 10,
    nov: 11, noviembre: 11, dic: 12, diciembre: 12
  };
  const EVENT_KEYWORDS = /torneo|evento|actividad|feria|festival|taller|charla|encuentro|exposici[oó]n|concierto|funci[oó]n|jornada|prelanzamiento|presentaci[oó]n|club de lectura|cuentacuentos|juego de mesa|tcg|pok[eé]mon|magic|catan|ajedrez|comic|c[oó]mic/i;
  const CARD_SELECTOR = 'article, li, [class*="event"], [class*="evento"], [class*="card"], [class*="item"], [class*="product"], [class*="program"], [class*="activity"], [class*="actividad"]';

  function clean(value, max = 1000) {
    const raw = String(value || '');
    let text = raw.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    if (typeof document !== 'undefined') {
      const node = document.createElement('textarea');
      node.innerHTML = text;
      text = node.value;
    }
    return text.replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function normalize(value) {
    return clean(value, 500).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function santiagoDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function validDateKey(year, month, day) {
    const key = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(`${key}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === key ? key : null;
  }

  function parseDateOnly(value) {
    const match = String(value || '').match(/^(20\d{2})-(\d{2})-(\d{2})/);
    return match ? validDateKey(match[1], match[2], match[3]) : null;
  }

  function addDays(key, days) {
    const date = new Date(`${key}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function normalizedYear(value) {
    if (!value) return null;
    const year = Number(value);
    return year < 100 ? 2000 + year : year;
  }

  function dateFromParts(dayValue, monthValue, yearValue, allowRollover = true) {
    const today = santiagoDateKey();
    const currentYear = Number(today.slice(0, 4));
    const currentMonth = Number(today.slice(5, 7));
    const month = Number(monthValue);
    let year = normalizedYear(yearValue) || currentYear;
    let key = validDateKey(year, month, Number(dayValue));
    if (!yearValue && allowRollover && key && key < today && currentMonth - month >= 6) {
      year += 1;
      key = validDateKey(year, month, Number(dayValue));
    }
    return key;
  }

  function rangeFromParts(startDay, startMonth, startYearValue, endDay, endMonth, endYearValue) {
    const today = santiagoDateKey();
    const currentYear = Number(today.slice(0, 4));
    const currentMonth = Number(today.slice(5, 7));
    let startYear = normalizedYear(startYearValue) || currentYear;
    let endYear = normalizedYear(endYearValue) || startYear + (Number(endMonth) < Number(startMonth) ? 1 : 0);
    if (!startYearValue && !endYearValue && currentMonth - Number(startMonth) >= 6) {
      startYear += 1;
      endYear += 1;
    }
    return {
      fecha: validDateKey(startYear, Number(startMonth), Number(startDay)),
      fechaFin: validDateKey(endYear, Number(endMonth), Number(endDay))
    };
  }

  function parseLooseDate(value) {
    const raw = clean(value, 1800);
    const iso = raw.match(/(20\d{2})-(\d{2})-(\d{2})/);
    if (iso) return validDateKey(iso[1], iso[2], iso[3]);
    const numeric = raw.match(/(?:^|[^0-9])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?(?![0-9])/);
    if (numeric) return dateFromParts(numeric[1], numeric[2], numeric[3]);
    const text = normalize(raw);
    const words = Object.keys(LOOSE_MONTHS).sort((a, b) => b.length - a.length).join('|');
    const match = text.match(new RegExp(`(?:^|\\s)(\\d{1,2})\\s+(?:de\\s+)?(${words})(?:\\s+(?:de\\s+)?(20\\d{2}))?`));
    return match ? dateFromParts(match[1], LOOSE_MONTHS[match[2]], match[3]) : null;
  }

  function parseLooseRange(value) {
    const raw = clean(value, 2000).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const numeric = raw.match(/(?:^|[^0-9])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?\s*(?:al|a|hasta|-)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?(?![0-9])/);
    if (numeric) return rangeFromParts(numeric[1], numeric[2], numeric[3], numeric[4], numeric[5], numeric[6]);
    const sharedNumeric = raw.match(/(?:^|[^0-9])(\d{1,2})\s*(?:al|a|hasta|y|-)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?(?![0-9])/);
    if (sharedNumeric) return rangeFromParts(sharedNumeric[1], sharedNumeric[3], sharedNumeric[4], sharedNumeric[2], sharedNumeric[3], sharedNumeric[4]);
    const words = Object.keys(LOOSE_MONTHS).sort((a, b) => b.length - a.length).join('|');
    const sharedText = raw.match(new RegExp(`\\b(\\d{1,2})\\s*(?:al|a|hasta|-)\\s*(\\d{1,2})\\s*(?:de\\s+)?(${words})(?:\\s*(?:de\\s+)?(20\\d{2}))?\\b`));
    if (sharedText) return rangeFromParts(sharedText[1], LOOSE_MONTHS[sharedText[3]], sharedText[4], sharedText[2], LOOSE_MONTHS[sharedText[3]], sharedText[4]);
    const textRange = raw.match(new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?(${words})\\s*,?\\s*(20\\d{2})?\\s*(?:al|a|hasta|-)\\s*(\\d{1,2})\\s*(?:de\\s+)?(${words})\\s*,?\\s*(20\\d{2})?\\b`));
    if (textRange) return rangeFromParts(textRange[1], LOOSE_MONTHS[textRange[2]], textRange[3], textRange[4], LOOSE_MONTHS[textRange[5]], textRange[6]);
    return { fecha: parseLooseDate(raw), fechaFin: null };
  }

  function safeUrl(value, fallback) {
    try {
      const url = new URL(String(value || ''), fallback);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallback || null;
    } catch (_) {
      return fallback || null;
    }
  }

  function price(text) {
    const value = clean(text, 600);
    if (/gratis|gratuita|entrada liberada|sin costo/i.test(value)) return { precio: 0, precioEstado: 'GRATIS' };
    const match = value.match(/\$\s*([\d.]+)/);
    const amount = match ? Number(match[1].replace(/\./g, '')) : 0;
    return amount > 0 ? { precio: amount, precioEstado: 'PAGADO' } : { precio: 0, precioEstado: 'NO_INFORMADO' };
  }

  function tags(text, defaults = ['cultural']) {
    const value = normalize(text);
    const output = new Set(defaults);
    if (/juego|ludic|ajedrez|catan|rol\b/.test(value)) output.add('juegos');
    if (/carta|tcg|pokemon|magic|yu gi oh/.test(value)) output.add('cartas');
    if (/libro|lectura|literar|cuento|comic|poesia|editorial/.test(value)) output.add('libros');
    if (/gratis|gratuita|entrada liberada/.test(value)) output.add('gratis');
    if (/famil|infantil|nino|nina/.test(value)) output.add('familiar');
    return Array.from(output).slice(0, 5);
  }

  function elementText(element, max = 1800) {
    return clean(element?.innerHTML || element?.textContent || '', max);
  }

  function first(element, selector) {
    return element?.querySelector(selector) || null;
  }

  function inWindow(event, maxDate) {
    return Boolean(event.fecha && event.fecha <= maxDate && (event.fechaFin || event.fecha) >= santiagoDateKey());
  }

  function uniqueEvents(events, limit = 20) {
    const seen = new Set();
    const unique = events
      .filter(event => event?.titulo && event?.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || b.confianza - a.confianza)
      .filter(event => {
        const key = `${normalize(event.titulo)}|${event.fecha}|${normalize(event.ubicacion)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const today = santiagoDateKey();
    const week = addDays(today, 7);
    const nextWeek = addDays(today, 14);
    const buckets = [[], [], []];
    unique.forEach(event => {
      const effective = event.fecha < today && event.fechaFin >= today ? today : event.fecha;
      buckets[effective <= week ? 0 : effective <= nextWeek ? 1 : 2].push(event);
    });
    const selected = [...buckets[0].slice(0, 8), ...buckets[1].slice(0, 6), ...buckets[2].slice(0, 6)];
    if (selected.length < limit) {
      const chosen = new Set(selected);
      selected.push(...unique.filter(event => !chosen.has(event)).slice(0, limit - selected.length));
    }
    return selected.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, limit);
  }

  function baseEvent(source, title, context, range, url, location, image, confidence = 82) {
    const foundPrice = price(context);
    return {
      titulo: clean(title, 200),
      descripcion: clean(context, 1000),
      ubicacion: clean(location, 200) || source.ubicacion || `${source.nombre}, Santiago`,
      fecha: range.fecha,
      fechaFin: range.fechaFin,
      ...(source.gratis && foundPrice.precioEstado === 'NO_INFORMADO' ? { precio: 0, precioEstado: 'GRATIS' } : foundPrice),
      imagenUrl: safeUrl(image, null),
      fuenteUrl: safeUrl(url, source.url),
      tags: tags(`${title} ${context}`, source.tags || ['cultural']),
      confianza: confidence,
      advertencias: 'Extracción local sin IA; confirmar detalles en la fuente.'
    };
  }

  function extractDatedHeadings(doc, source, maxDate) {
    const events = [];
    const ignored = /^(cartelera|programaci[oó]n|actividades|eventos|actuales|pr[oó]ximos eventos|esta semana|noticias|agenda)$/i;
    doc.querySelectorAll('h2, h3, h4, h5').forEach(heading => {
      const title = clean(heading.textContent, 200);
      if (title.length < 6 || ignored.test(title)) return;
      const card = heading.closest(CARD_SELECTOR) || heading.parentElement;
      let context = elementText(card);
      let range = parseLooseRange(context);
      if (!range.fecha) {
        context = clean(`${elementText(heading.parentElement)} ${elementText(heading.parentElement?.nextElementSibling)}`, 1800);
        range = parseLooseRange(context);
      }
      if (!range.fecha) return;
      const link = first(heading, 'a[href]') || heading.closest('a[href]') || first(card, 'a[href]');
      const location = first(card, '[class*="location"], [class*="venue"], [class*="address"], [class*="ubicacion"], [class*="lugar"]');
      const image = first(card, 'img');
      const event = baseEvent(source, title, context, range, link?.getAttribute('href'), location?.textContent, image?.getAttribute('src'), 88);
      if (inWindow(event, maxDate)) events.push(event);
    });
    return events;
  }

  function heritageDate(value) {
    const iso = parseDateOnly(value);
    if (iso) return iso;
    const text = normalize(value);
    const match = text.match(new RegExp(`(\\d{1,2})\\s+(${SPANISH_MONTHS.join('|')})\\s+(20\\d{2})`));
    return match ? validDateKey(match[3], SPANISH_MONTHS.indexOf(match[2]) + 1, match[1]) : null;
  }

  function extractHeritage(doc, source, maxDate) {
    const events = [];
    doc.querySelectorAll('.node--evento, .views-row').forEach(card => {
      const link = first(card, 'h2 a, h3 a');
      const title = clean(link?.textContent, 200);
      const dateNodes = card.querySelectorAll('.field--name-field-fechas time, time[datetime]');
      const fecha = heritageDate(dateNodes[0]?.getAttribute('datetime') || dateNodes[0]?.textContent);
      const fechaFin = heritageDate(dateNodes[1]?.getAttribute('datetime') || dateNodes[1]?.textContent);
      const location = clean(first(card, '.field--name-field-direccion')?.textContent, 200) || source.ubicacion || 'Santiago';
      if (!title || !fecha || source.id === 'patrimonio-cultural' && !/santiago|recoleta|quinta normal/i.test(location)) return;
      const context = elementText(card);
      const event = baseEvent(source, title, context, { fecha, fechaFin }, link?.getAttribute('href'), location, first(card, 'img')?.getAttribute('src'), 95);
      if (source.id === 'biblioteca-nacional' || source.gratis) Object.assign(event, { precio: 0, precioEstado: 'GRATIS', advertencias: null });
      if (inWindow(event, maxDate)) events.push(event);
    });
    return events;
  }

  function isProvidenciaEvent(title, location) {
    return /biblioteca|cafe literario|montecarmelo|libro|lectura|cuento|poesia|comic|ajedrez|videojuego|juego de mesa|feria|festival|cine|teatro|exposicion|museo|patrimonio|arte|ilustrad|encuadernacion|ghibli|taller|mercado|deport|baile|recorrido|tour|bonsai|idioma/.test(normalize(`${title} ${location}`));
  }

  function extractProvidencia(doc, source, maxDate) {
    const events = [];
    const year = santiagoDateKey().slice(0, 4);
    doc.querySelectorAll('table tr').forEach(row => {
      const cells = row.querySelectorAll(':scope > td');
      if (cells.length < 3) return;
      const dateText = clean(cells[0].textContent, 250);
      const details = clean(cells[1].textContent, 1000);
      const range = parseLooseRange(`${dateText} ${year}`);
      const title = clean(details.split(/inscripciones|gratuita|más info|previa inscripción|valor sujeto/i)[0], 200).replace(/^["“”]+|["“”]+$/g, '').trim();
      const location = clean(cells[2].textContent, 200) || source.ubicacion || 'Providencia, Santiago';
      if (!range.fecha || !title || !isProvidenciaEvent(title, location)) return;
      const event = baseEvent(source, title, details, range, first(cells[1], 'a[href]')?.getAttribute('href'), location, null, 92);
      if (inWindow(event, maxDate)) events.push(event);
    });
    return events;
  }

  function extractHoyJuegue(doc, source, maxDate) {
    const events = [];
    doc.querySelectorAll('article.hja-overview-card').forEach(card => {
      const link = first(card, 'h3 a');
      const title = clean(link?.textContent, 200);
      const fecha = parseDateOnly(first(card, 'time[datetime]')?.getAttribute('datetime'));
      const location = clean(first(card, '.hja-overview-card__location')?.textContent, 200);
      if (!title || !fecha || !/santiago/i.test(location)) return;
      const context = elementText(card);
      const event = baseEvent(source, title, context, { fecha, fechaFin: null }, link?.getAttribute('href'), location, first(card, 'img')?.getAttribute('src'), 96);
      if (inWindow(event, maxDate)) events.push(event);
    });
    return events;
  }

  function genericFromText(source, title, context, url, location, image, maxDate) {
    if (!EVENT_KEYWORDS.test(`${title} ${context}`)) return null;
    const range = parseLooseRange(context);
    if (!range.fecha) return null;
    const event = baseEvent(source, title, context, range, url, location, image, 74);
    return event.titulo.length >= 6 && inWindow(event, maxDate) ? event : null;
  }

  function extractGeneric(doc, source, maxDate) {
    const events = [];
    doc.querySelectorAll('a[href]').forEach(link => {
      const title = clean(link.textContent || link.getAttribute('aria-label') || link.getAttribute('title'), 200);
      if (!title || !EVENT_KEYWORDS.test(title)) return;
      const card = link.closest(CARD_SELECTOR) || link.parentElement;
      const context = `${first(card, 'time[datetime]')?.getAttribute('datetime') || card?.getAttribute('data-date') || ''} ${elementText(card)}`;
      const location = first(card, '[class*="location"], [class*="venue"], [class*="address"], [class*="ubicacion"]');
      const event = genericFromText(source, title, context, link.getAttribute('href'), location?.textContent, first(card, 'img')?.getAttribute('src'), maxDate);
      if (event) events.push(event);
    });
    return events;
  }

  function flattenJsonLd(value, output = []) {
    if (Array.isArray(value)) value.forEach(item => flattenJsonLd(item, output));
    else if (value && typeof value === 'object') {
      const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
      if (types.includes('Event')) output.push(value);
      if (value['@graph']) flattenJsonLd(value['@graph'], output);
    }
    return output;
  }

  function jsonLocation(location) {
    if (!location) return 'Santiago';
    if (typeof location === 'string') return location;
    const address = location.address;
    const addressText = typeof address === 'string' ? address : [address?.streetAddress, address?.addressLocality, address?.addressRegion].filter(Boolean).join(', ');
    return [location.name, addressText].filter(Boolean).join(', ') || 'Santiago';
  }

  function extractJsonLd(doc, source, maxDate) {
    const events = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        flattenJsonLd(JSON.parse(script.textContent)).forEach(item => {
          const fecha = parseDateOnly(item.startDate);
          const fechaFin = parseDateOnly(item.endDate);
          if (!fecha || fecha > maxDate || (fechaFin || fecha) < santiagoDateKey()) return;
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const amount = Math.max(0, Math.round(Number(offer?.lowPrice ?? offer?.price ?? 0) || 0));
          const priceState = offer && (amount === 0 || /free/i.test(String(offer.availability))) ? 'GRATIS' : amount > 0 ? 'PAGADO' : 'NO_INFORMADO';
          events.push({
            titulo: clean(item.name, 200), descripcion: clean(item.description, 1000), ubicacion: clean(jsonLocation(item.location), 200),
            fecha, fechaFin, precio: amount, precioEstado: priceState,
            imagenUrl: safeUrl(Array.isArray(item.image) ? item.image[0] : item.image, null),
            fuenteUrl: safeUrl(item.url, source.url), tags: tags(`${item.name} ${item.description}`, source.tags || ['cultural']),
            confianza: 90, advertencias: null
          });
        });
      } catch (_) {}
    });
    return events;
  }

  function extractRss(html, source, maxDate) {
    const doc = new DOMParser().parseFromString(html, 'application/xml');
    const events = [];
    Array.from(doc.querySelectorAll('item')).slice(0, 40).forEach(item => {
      const title = clean(first(item, 'title')?.textContent, 200);
      const context = clean(first(item, 'description')?.textContent, 1800);
      const event = genericFromText(source, title, context, first(item, 'link')?.textContent, 'Santiago', null, maxDate);
      if (event) events.push(event);
    });
    return events;
  }

  function extractSource(html, source) {
    const maxDate = addDays(santiagoDateKey(), 45);
    if (source.tipo === 'RSS') return uniqueEvents(extractRss(html, source, maxDate), 20);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let direct = [];
    if (source.id === 'biblioteca-nacional' || source.id === 'patrimonio-cultural' || source.extractor === 'HERITAGE') direct = extractHeritage(doc, source, maxDate);
    else if (source.id === 'bibliotecas-providencia' || source.extractor === 'PROVIDENCIA') direct = extractProvidencia(doc, source, maxDate);
    else if (source.id === 'hoy-jugue') direct = extractHoyJuegue(doc, source, maxDate);
    else if (source.extractor === 'DATED_HEADINGS') direct = extractDatedHeadings(doc, source, maxDate);
    if (!direct.length) direct = extractGeneric(doc, source, maxDate);
    return uniqueEvents([...uniqueEvents(direct, 20), ...extractJsonLd(doc, source, maxDate)], 20);
  }

  function eventDetailUrls(html, source, limit = 12) {
    if (!source.followEventLinks) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const sourceUrl = new URL(source.url);
    const urls = [];
    const seen = new Set();
    doc.querySelectorAll('a[href]').forEach(link => {
      if (urls.length >= limit) return;
      try {
        const url = new URL(link.getAttribute('href'), source.url);
        if (url.origin !== sourceUrl.origin || url.pathname === sourceUrl.pathname) return;
        if (!/\/eventos?\//i.test(url.pathname) || seen.has(url.toString())) return;
        seen.add(url.toString());
        urls.push(url.toString());
      } catch (_) {}
    });
    return urls;
  }

  function mergeEvents(events, limit = 20) {
    return uniqueEvents(events, limit);
  }

  function eventFamilyKey(title) {
    return normalize(clean(title, 300).replace(/\s+(?:en|@)\s+[^|]+$/i, '').replace(/\s*[|]\s*[^|]+$/i, '').trim());
  }

  async function sha256(value) {
    if (root.crypto?.subtle) {
      const bytes = new TextEncoder().encode(value);
      const digest = await root.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    return `local-${(hash >>> 0).toString(16)}`;
  }

  async function aggregateResults(results) {
    const seen = new Set();
    const familyCounts = new Map();
    const suggestions = [];
    for (const result of results) {
      for (const event of result.events || []) {
        if (/\bnexus\b/i.test(`${event.titulo} ${event.descripcion}`)) continue;
        const raw = `${normalize(event.titulo)}|${event.fecha}|${normalize(event.ubicacion)}`;
        const fingerprint = await sha256(raw);
        const family = eventFamilyKey(event.titulo);
        const count = familyCounts.get(family) || 0;
        if (seen.has(fingerprint) || count >= 2) continue;
        seen.add(fingerprint);
        familyCounts.set(family, count + 1);
        suggestions.push({ ...event, id: fingerprint, fingerprint, fuenteId: result.sourceId, fuenteNombre: result.nombre });
      }
    }
    return {
      resultados: results.map(({ events, ...summary }) => summary),
      suggestions,
      nuevos: suggestions.length,
      iaUsos: 0,
      iaNoDisponible: 0,
      modoAhorro: true,
      servicioIa: false,
      respaldoIaHabilitado: false,
      ejecucion: 'EXTENSION_LOCAL'
    };
  }

  function friendlyError(error) {
    const message = String(error?.message || error || 'Error desconocido');
    if (/abort/i.test(message)) return 'La fuente tardó más de 12 segundos en responder.';
    if (/failed to fetch|fetch failed|networkerror/i.test(message)) return 'No se pudo conectar con la fuente.';
    const http = message.match(/HTTP\s+(\d{3})/i);
    if (http?.[1] === '429') return 'La fuente limitó temporalmente las consultas (HTTP 429).';
    if (http?.[1] === '403') return 'La fuente bloqueó la consulta automática (HTTP 403).';
    if (http) return `La fuente respondió con error ${http[1]}.`;
    return clean(message, 240) || 'Error desconocido';
  }

  const api = {
    CHANNEL, SOURCES, SPANISH_MONTHS, santiagoDateKey, parseLooseDate, parseLooseRange,
    extractSource, eventDetailUrls, mergeEvents, aggregateResults, friendlyError
  };
  root.QHSDiscovery = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
