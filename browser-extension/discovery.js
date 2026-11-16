(function (root) {
  'use strict';

  const CHANNEL = 'quehacer-santiago-local-discovery-v1';
  const SPANISH_MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const SOURCES = [
    { id: 'biblioteca-santiago', nombre: 'Biblioteca de Santiago', tipo: 'WEB', url: 'https://www.bibliotecasantiago.gob.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Biblioteca de Santiago, Matucana 151', gratis: true, tags: ['biblioteca', 'libros', 'cultural', 'gratis'] },
    { id: 'biblioteca-nacional', nombre: 'Biblioteca Nacional', tipo: 'WEB', url: 'https://www.bibliotecanacional.gob.cl/cartelera' },
    { id: 'bibliotecas-providencia', nombre: 'Bibliotecas de Providencia', tipo: 'WEB', url: 'https://biblioteca.providencia.cl/provi/site/edic/base/port/inicio.html' },
    { id: 'patrimonio-cultural', nombre: 'Cartelera de Patrimonio Cultural', tipo: 'WEB', url: 'https://www.bibliotecanacional.gob.cl/cartelera/red-nacional?region=RM' },
    { id: 'visit-santiago', nombre: 'Visit Santiago', tipo: 'WEB', url: 'https://visitsantiago.travel/en/panoramas/', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago', tags: ['panorama', 'cultural'] },
    { id: 'cclm', nombre: 'Centro Cultural La Moneda', tipo: 'WEB', url: 'https://www.cclm.cl/actividades-y-talleres/', extractor: 'DATED_HEADINGS', ubicacion: 'Centro Cultural La Moneda, Santiago', tags: ['arte', 'cultural'] },
    { id: 'gam', nombre: 'GAM', tipo: 'WEB', url: 'https://gam.cl/es/calendario/' },
    { id: 'la-tercera-finde', nombre: 'La Tercera Finde', tipo: 'WEB', url: 'https://www.latercera.com/canal/finde/', extractor: 'LA_TERCERA_FINDE', ubicacion: 'Santiago', tags: ['panorama', 'cultural'], followEventLinks: true, detailPathPrefix: '/finde/noticia/', detailLimit: 12, detailsOnly: true },
    { id: 'camara-libro', nombre: 'Cámara Chilena del Libro y FILSA', tipo: 'WEB', url: 'https://camaradellibro.cl/' },
    { id: 'hoy-jugue', nombre: 'Hoy Jugué · ferias y juegos', tipo: 'WEB', url: 'https://hoyjugue.cl/agenda/' },
    { id: 'mesa-1', nombre: 'Mesa 1', tipo: 'WEB', url: 'https://www.mesa1.cl/pages/events', extractor: 'DATED_HEADINGS', ubicacion: 'Mesa 1, Av. Recoleta 901, local 4', tags: ['cartas', 'juegos'], maxEvents: 2, recurringEvents: [{ titulo: 'Torneos casuales semanales de TCG en Mesa 1', weekday: 6, descripcion: 'Programación semanal de Pokémon, Magic, One Piece y otros TCG. Confirma el torneo y la inscripción en la fuente.', ubicacion: 'Mesa 1, Av. Recoleta 901, local 4' }] },
    { id: 'bastion-goblin', nombre: 'Bastión Goblin', tipo: 'WEB', url: 'https://bastiongoblin.com/collections/magic-eventos', extractor: 'DATED_HEADINGS', ubicacion: 'Bastión Goblin, Apoquindo 7750, Las Condes', tags: ['cartas', 'juegos'], maxEvents: 2 },
    { id: 'area-52', nombre: 'Área 52', tipo: 'WEB', url: 'https://area52.cl/', extractor: 'PRODUCT_DETAIL', ubicacion: 'Área 52, Santa Isabel 962, Providencia', tags: ['cartas', 'juegos'], followEventLinks: true, detailPathPrefix: '/products/', detailLimit: 6, detailsOnly: true, maxEvents: 2 },
    { id: 'magicsur', nombre: 'MagicSur · torneos de cartas', tipo: 'WEB', url: 'https://www.cartasmagicsur.cl/torneos' },
    { id: 'torneos-tcg', nombre: 'TorneosTCG · calendario Pokémon RM', tipo: 'WEB', url: 'https://www.torneostcg.cl/region-metropolitana/torneos/pokemon-tcg', extractor: 'DATE_GROUPS', ubicacion: 'Región Metropolitana', tags: ['cartas', 'juegos'], maxEvents: 2, santiagoOnly: true, recurringEvents: [{ titulo: 'Torneos semanales de Pokémon TCG en la Región Metropolitana', weekday: 3, descripcion: 'Calendario semanal por tienda, comuna y horario. Revisa la fuente para escoger el torneo que prefieras.', ubicacion: 'Región Metropolitana' }, { titulo: 'Torneos de fin de semana de Pokémon TCG en la Región Metropolitana', weekday: 6, descripcion: 'Calendario de torneos Pokémon TCG del fin de semana. Confirma tienda, horario y cupos en la fuente.', ubicacion: 'Región Metropolitana' }] },
    { id: 'eventhoy-juegos', nombre: 'EventHoy · juegos y gaming', tipo: 'WEB', url: 'https://eventhoy.com/categoria/juegos', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago', tags: ['juegos'] },
    { id: 'deck-shield', nombre: 'Deck Shield · eventos TCG', tipo: 'WEB', url: 'https://deckshield.cl/pages/eventos', extractor: 'DATE_GROUPS', ubicacion: 'Santiago', tags: ['cartas', 'juegos'], santiagoOnly: true, maxEvents: 12 },
    { id: 'instituto-italiano', nombre: 'Instituto Italiano · Barrio Italia', tipo: 'WEB', url: 'https://iicsantiago.esteri.it/es/gli_eventi/calendario/', extractor: 'DATED_HEADINGS', ubicacion: 'Providencia, Santiago', tags: ['barrio italia', 'cultural'] },
    { id: 'matucana-100', nombre: 'Matucana 100', tipo: 'WEB', url: 'https://www.m100.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Matucana 100, Estación Central', tags: ['cultural'] },
    { id: 'mnba', nombre: 'Museo Nacional de Bellas Artes', tipo: 'WEB', url: 'https://www.mnba.gob.cl/cartelera', extractor: 'HERITAGE', ubicacion: 'Museo Nacional de Bellas Artes, Santiago', gratis: true, tags: ['arte', 'cultural', 'gratis'] },
    { id: 'mac', nombre: 'Museo de Arte Contemporáneo', tipo: 'WEB', url: 'https://mac.uchile.cl/periodo/actuales/', extractor: 'DATED_HEADINGS', ubicacion: 'Museo de Arte Contemporáneo, Santiago', gratis: true, tags: ['arte', 'cultural', 'gratis'] },
    { id: 'ceina', nombre: 'CEINA · cartelera cultural', tipo: 'WEB', url: 'https://ceina.cl/cartelera/', extractor: 'DATED_HEADINGS', ubicacion: 'CEINA, Arturo Prat 33, Santiago', tags: ['cultural'] },
    { id: 'cultura-las-condes', nombre: 'Corporación Cultural Las Condes', tipo: 'WEB', url: 'https://www.culturallascondes.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Las Condes, Santiago', tags: ['arte', 'cultural'] },
    { id: 'municipalidad-santiago', nombre: 'Municipalidad de Santiago · actividades', tipo: 'WEB', url: 'https://www.munistgo.cl/talleres-comunidad/', extractor: 'DATED_HEADINGS', ubicacion: 'Santiago Centro', tags: ['municipal', 'cultural'] },
    { id: 'municipalidad-providencia', nombre: 'Municipalidad de Providencia · actividades', tipo: 'WEB', url: 'https://providencia.cl/provi/site/edic/base/port/inicio.html', extractor: 'PROVIDENCIA', ubicacion: 'Providencia, Santiago', tags: ['municipal', 'cultural'] },
    { id: 'teatro-la-florida', nombre: 'Teatro Municipal de La Florida', tipo: 'WEB', url: 'https://portaldisc.com/tickets/', extractor: 'DATED_HEADINGS', ubicacion: 'Teatro Municipal de La Florida, La Florida', tags: ['municipal', 'teatro', 'cultural'], requiredText: 'Teatro Municipal de La Florida' },
    { id: 'cultura-nunoa', nombre: 'Corporación Cultural de Ñuñoa', tipo: 'WEB', url: 'https://www.ccn.cl/noticias', extractor: 'DATED_HEADINGS', ubicacion: 'Ñuñoa, Santiago', tags: ['municipal', 'cultural'], recurringEvents: [{ titulo: 'Agenda cultural semanal de Ñuñoa', weekday: 6, descripcion: 'Revisa las actividades, cine, literatura, exposiciones y encuentros publicados por la Corporación Cultural de Ñuñoa.', ubicacion: 'Ñuñoa, Santiago' }], maxEvents: 4 },
    { id: 'mallplaza-vespucio', nombre: 'Mallplaza Vespucio · panoramas', tipo: 'WEB', url: 'https://www.mallplaza.com/cl/vespucio/panoramas/index.html', extractor: 'DATED_HEADINGS', ubicacion: 'Mallplaza Vespucio, La Florida', tags: ['mall', 'panorama'], extractEmbeddedJson: true, recurringEvents: [{ titulo: 'Panoramas y actividades de Mallplaza Vespucio', weekday: 6, descripcion: 'Revisa el calendario de actividades del centro comercial para esta semana y confirma fechas y condiciones en la fuente.', ubicacion: 'Mallplaza Vespucio, La Florida' }], maxEvents: 6 },
    { id: 'factoria-franklin', nombre: 'Factoría Franklin · agenda', tipo: 'WEB', url: 'https://factoria-franklin.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Factoría Franklin, Santiago', tags: ['barrio franklin', 'ferias', 'cultural'] },
    { id: 'mavi-uc', nombre: 'MAVI UC · Barrio Lastarria', tipo: 'WEB', url: 'https://mavi.uc.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'MAVI UC, José Victorino Lastarria 307', tags: ['lastarria', 'arte', 'cultural'], recurringEvents: [{ titulo: 'Visita MAVI UC en Barrio Lastarria', weekday: 6, descripcion: 'Recorre la programación y las exposiciones vigentes del Museo de Artes Visuales. Confirma la muestra actual y las entradas en la fuente.', ubicacion: 'MAVI UC, José Victorino Lastarria 307' }], maxEvents: 4 },
    { id: 'barrio-lastarria', nombre: 'Barrio Lastarria · sitio oficial', tipo: 'WEB', url: 'https://barriolastarria.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Barrio Lastarria, Santiago', tags: ['lastarria', 'cultural'], recurringEvents: [{ titulo: 'Recorrido cultural por Barrio Lastarria', weekday: 6, descripcion: 'Plan para recorrer museos, espacios culturales, librerías, tiendas y gastronomía del Barrio Lastarria.', ubicacion: 'Barrio Lastarria, Santiago' }], maxEvents: 2 },
    { id: 'club-chocolate', nombre: 'Club Chocolate · Bellavista', tipo: 'WEB', url: 'https://clubchocolate.cl/', extractor: 'DATED_HEADINGS', ubicacion: 'Club Chocolate, Barrio Bellavista', tags: ['bellavista', 'música', 'noche'] }
  ];

  const LOOSE_MONTHS = {
    ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4,
    may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8,
    sep: 9, sept: 9, septiembre: 9, setiembre: 9, oct: 10, octubre: 10,
    nov: 11, noviembre: 11, dic: 12, diciembre: 12
  };
  const EVENT_KEYWORDS = /torneo|league|challenge|cup|liga|commander|evento|actividad|feria|festival|taller|charla|encuentro|exposici[oó]n|concierto|funci[oó]n|jornada|prelanzamiento|presentaci[oó]n|club de lectura|cuentacuentos|juego de mesa|tcg|pok[eé]mon|magic|catan|ajedrez|comic|c[oó]mic/i;
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
    if (match) return dateFromParts(match[1], LOOSE_MONTHS[match[2]], match[3]);
    const monthFirst = text.match(new RegExp(`(?:^|\\s)(${words})\\s+(\\d{1,2})(?:\\s+(20\\d{2}))?`));
    return monthFirst ? dateFromParts(monthFirst[2], LOOSE_MONTHS[monthFirst[1]], monthFirst[3]) : null;
  }

  function parseLooseRange(value) {
    const raw = clean(value, 2000).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const numeric = raw.match(/(?:^|[^0-9])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?\s*(?:al|a|hasta|-)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?(?![0-9])/);
    if (numeric) return rangeFromParts(numeric[1], numeric[2], numeric[3], numeric[4], numeric[5], numeric[6]);
    const sharedNumeric = raw.match(/(?:^|[^0-9])(\d{1,2})\s*(?:al|a|hasta|y|-)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|20\d{2}))?(?![0-9])/);
    if (sharedNumeric) return rangeFromParts(sharedNumeric[1], sharedNumeric[3], sharedNumeric[4], sharedNumeric[2], sharedNumeric[3], sharedNumeric[4]);
    const words = Object.keys(LOOSE_MONTHS).sort((a, b) => b.length - a.length).join('|');
    const dayFirstList = raw.match(new RegExp(`\\b(\\d{1,2})\\s*[,]\\s*(\\d{1,2})(?:\\s*(?:y|,)\\s*(\\d{1,2}))?\\s*(?:de\\s+)?(${words})(?:\\s*(?:de\\s+)?(20\\d{2}))?\\b`));
    if (dayFirstList) {
      const endDay = dayFirstList[3] || dayFirstList[2];
      return rangeFromParts(dayFirstList[1], LOOSE_MONTHS[dayFirstList[4]], dayFirstList[5], endDay, LOOSE_MONTHS[dayFirstList[4]], dayFirstList[5]);
    }
    const monthFirstList = raw.match(new RegExp(`\\b(${words})\\s+(\\d{1,2})\\s*[,]\\s*(\\d{1,2})(?:\\s*y\\s*(\\d{1,2}))?\\s*[,]?\\s*(20\\d{2})\\b`));
    if (monthFirstList) {
      const endDay = monthFirstList[4] || monthFirstList[3];
      return rangeFromParts(monthFirstList[2], LOOSE_MONTHS[monthFirstList[1]], monthFirstList[5], endDay, LOOSE_MONTHS[monthFirstList[1]], monthFirstList[5]);
    }
    const monthFirstRange = raw.match(new RegExp(`\\b(${words})\\s+(\\d{1,2})\\s*[,]?\\s*(20\\d{2})?\\s*(?:al|a|hasta|-|/|\\|)\\s*(${words})\\s+(\\d{1,2})\\s*[,]?\\s*(20\\d{2})?\\b`));
    if (monthFirstRange) return rangeFromParts(monthFirstRange[2], LOOSE_MONTHS[monthFirstRange[1]], monthFirstRange[3], monthFirstRange[5], LOOSE_MONTHS[monthFirstRange[4]], monthFirstRange[6]);
    const sharedText = raw.match(new RegExp(`\\b(\\d{1,2})\\s*(?:al|a|hasta|y|-)\\s*(\\d{1,2})\\s*(?:de\\s+)?(${words})(?:\\s*(?:de\\s+)?(20\\d{2}))?\\b`));
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
      if (title.length < 6 || ignored.test(title) || Boolean(parseLooseDate(title) && !/[a-záéíóúñ]{4,}/i.test(title.replace(/(?:ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)[a-z]*/gi, '')))) return;
      const card = heading.closest(CARD_SELECTOR) || heading.parentElement;
      let context = elementText(card);
      let range = parseLooseRange(context);
      if (!range.fecha) {
        context = clean(`${elementText(heading.parentElement)} ${elementText(heading.parentElement?.nextElementSibling)}`, 1800);
        range = parseLooseRange(context);
      }
      if (!range.fecha) return;
      if (source.requiredText && !normalize(`${title} ${context}`).includes(normalize(source.requiredText))) return;
      const link = first(heading, 'a[href]') || heading.closest('a[href]') || first(card, 'a[href]');
      const location = first(card, '[class*="location"], [class*="venue"], [class*="address"], [class*="ubicacion"], [class*="lugar"]');
      const image = first(card, 'img');
      const event = baseEvent(source, title, context, range, link?.getAttribute('href'), location?.textContent, image?.getAttribute('src'), 88);
      if (inWindow(event, maxDate)) events.push(event);
    });
    return events;
  }

  function nextWeekday(weekday, weekOffset = 0) {
    const today = santiagoDateKey();
    const current = new Date(`${today}T12:00:00.000Z`).getUTCDay();
    const delta = (Number(weekday) - current + 7) % 7;
    return addDays(today, delta + Number(weekOffset || 0) * 7);
  }

  function extractRecurringEvents(source, maxDate) {
    return (source.recurringEvents || []).map(item => {
      const fecha = nextWeekday(item.weekday, item.weekOffset);
      const event = baseEvent(source, item.titulo, item.descripcion, { fecha, fechaFin: null }, source.url, item.ubicacion, null, 72);
      event.advertencias = 'Plan recurrente: confirma programación, cupos y horario en la fuente.';
      return event;
    }).filter(event => inWindow(event, maxDate));
  }

  function extractProductDetail(doc, source, maxDate) {
    const titleNode = doc.querySelector('main h1, h1');
    const title = clean(titleNode?.textContent, 200);
    const root = titleNode?.closest('main') || doc.querySelector('main') || doc.body;
    const context = elementText(root, 3000);
    const range = parseLooseRange(`${title} ${context}`);
    if (!title || !range.fecha) return [];
    const locationMatch = context.match(/(?:d[oó]nde|direcci[oó]n)\s*[:：]?\s*(.{3,180}?)(?=\s+(?:check-in|hora|horario|valor|entrada|formato)\b|$)/i);
    const location = clean(locationMatch?.[1], 200) || source.ubicacion;
    const event = baseEvent(source, title, context, range, source.url, location, first(root, 'img')?.getAttribute('src'), 94);
    return inWindow(event, maxDate) ? [event] : [];
  }

  function sectionFragment(doc, start, end) {
    try {
      const range = doc.createRange();
      range.setStartAfter(start);
      if (end) range.setEndBefore(end);
      else range.setEndAfter(start.parentElement || start);
      const container = doc.createElement('div');
      container.appendChild(range.cloneContents());
      return container;
    } catch (_) {
      return start.parentElement || start;
    }
  }

  function groupedDateNodes(doc) {
    const nodes = Array.from(doc.querySelectorAll('h2, h3, h4, time, [class*="date"], [class*="fecha"]'));
    return nodes.filter(node => {
      const text = clean(node.textContent, 80);
      return text.length <= 45 && Boolean(parseLooseDate(text));
    });
  }

  function groupedEventTitle(text) {
    const firstPart = clean(text, 260).split('·')[0];
    return clean(firstPart.replace(/\s+\d{1,2}:\d{2}(?:\s*hrs?)?.*$/i, ''), 200);
  }

  function extractDateGroups(doc, source, maxDate) {
    const events = [];
    const dates = groupedDateNodes(doc);
    dates.forEach((dateNode, index) => {
      const fecha = parseLooseDate(clean(dateNode.textContent, 80));
      if (!fecha) return;
      const section = sectionFragment(doc, dateNode, dates[index + 1]);
      const candidates = Array.from(section.querySelectorAll('a[href], h3, h4'));
      candidates.forEach(candidate => {
        const context = clean(candidate.textContent, 1000);
        const title = groupedEventTitle(context);
        if (title.length < 8 || !/league|torneo|cup|challenge|liga|prelanzamiento|commander|pok[eé]mon/i.test(`${title} ${context}`)) return;
        if (source.santiagoOnly && (isOutsideSantiago(context) || !isSantiagoEventText(context))) return;
        const parts = context.split('·').map(part => clean(part, 220)).filter(Boolean);
        const location = parts.find(part => /metro|santiago|providencia|recoleta|las condes|la florida|ñuñoa|nunoa|maip[uú]|san miguel|san bernardo|buin|talagante/i.test(part)) || source.ubicacion;
        const link = candidate.matches('a[href]') ? candidate : first(candidate, 'a[href]');
        const event = baseEvent(source, title, context, { fecha, fechaFin: null }, link?.getAttribute('href') || source.url, location, null, 94);
        if (inWindow(event, maxDate)) events.push(event);
      });
    });
    return events;
  }

  function textBetweenHeadings(doc, heading, nextHeading) {
    try {
      const range = doc.createRange();
      range.setStartAfter(heading);
      if (nextHeading) range.setEndBefore(nextHeading);
      else range.setEndAfter(heading.parentElement || heading);
      const container = doc.createElement('div');
      container.appendChild(range.cloneContents());
      return elementText(container, 2200);
    } catch (_) {
      return clean(`${elementText(heading.parentElement)} ${elementText(heading.parentElement?.nextElementSibling)}`, 2200);
    }
  }

  function labeledLocation(context, fallback) {
    const match = clean(context, 2200).match(/direcci[oó]n\s+(.{3,220}?)(?=\s+(?:horario|entrada)\b|$)/i);
    return clean(match?.[1], 200) || fallback;
  }

  function isOutsideSantiago(location) {
    return /\b(?:concepci[oó]n|valpara[ií]so|vi[ñn]a del mar|la serena|coquimbo|rancagua|talca|chill[aá]n|temuco|valdivia|osorno|puerto montt|punta arenas|antofagasta|iquique|arica)\b/i.test(location || '');
  }

  function isSantiagoEventText(value) {
    return /metro|santiago|providencia|recoleta|las condes|la florida|ñuñoa|nunoa|maip[uú]|san miguel|san bernardo|buin|talagante|puente alto|la reina|vitacura|lo barnechea|quilicura|huechuraba|independencia|estaci[oó]n central|cerrillos|pudahuel|peñalol[eé]n|macul|la cisterna|el bosque|la granja|quinta normal|lo prado|lo espejo|san ram[oó]n|padre hurtado|melipilla|colina|lampa/i.test(value || '');
  }

  function findeArticleRange(root, title) {
    const fromTitle = parseLooseRange(title);
    if (fromTitle.fecha) return fromTitle;
    const dateCue = /se (?:celebra|realiza|har[aá])|tendr[aá] lugar|este (?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)|los d[ií]as|desde el|entre el|hasta el/i;
    for (const paragraph of root.querySelectorAll('p')) {
      const text = elementText(paragraph, 1200);
      if (!dateCue.test(text)) continue;
      const range = parseLooseRange(text);
      if (range.fecha) return range;
    }
    return { fecha: null, fechaFin: null };
  }

  function extractLaTerceraFinde(doc, source, maxDate) {
    const titleNode = doc.querySelector('main h1, article h1, h1');
    const articleTitle = clean(titleNode?.textContent, 200);
    if (!articleTitle) return [];
    const root = titleNode.closest('article') || titleNode.closest('main') || doc.querySelector('main') || doc.body;
    const articleRange = findeArticleRange(root, articleTitle);
    if (!articleRange.fecha) return [];

    const events = [];
    const headings = Array.from(root.querySelectorAll('h2, h3'));
    const stopTitle = /^(lo [uú]ltimo|lo m[aá]s le[ií]do|imperdibles|servicios|comentarios|m[aá]s sobre)/i;
    const ignoredTitle = /^(finde|gu[ií]a del ocio|tres panoramas|panoramas|direcci[oó]n|horario|entrada)/i;
    for (let index = 0; index < headings.length; index += 1) {
      const heading = headings[index];
      const title = clean(heading.textContent, 200);
      if (stopTitle.test(title)) break;
      if (title.length < 6 || title.length > 140 || ignoredTitle.test(title)) continue;
      const context = textBetweenHeadings(doc, heading, headings[index + 1]);
      if (context.length < 12) continue;
      const location = labeledLocation(context, source.ubicacion);
      if (isOutsideSantiago(location)) continue;
      const ownRange = parseLooseRange(`${title} ${context}`);
      const range = ownRange.fecha ? ownRange : articleRange;
      const event = baseEvent(source, title, context, range, source.url, location, first(heading.parentElement, 'img')?.getAttribute('src'), 94);
      if (inWindow(event, maxDate)) events.push(event);
    }

    if (events.length) return events;
    const articleContext = elementText(root, 2200);
    const location = labeledLocation(articleContext, source.ubicacion);
    if (isOutsideSantiago(location)) return [];
    const fallback = baseEvent(source, articleTitle, articleContext, articleRange, source.url, location, first(root, 'img')?.getAttribute('src'), 86);
    return inWindow(fallback, maxDate) ? [fallback] : [];
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

  function embeddedLocation(value, fallback) {
    if (typeof value === 'string') return clean(value, 200) || fallback;
    if (!value || typeof value !== 'object') return fallback;
    return clean(value.name || value.address || value.label || value.title, 200) || fallback;
  }

  function flattenEmbeddedEvents(value, source, maxDate, output = [], depth = 0) {
    if (!value || depth > 12 || output.length >= 30) return output;
    if (Array.isArray(value)) {
      value.forEach(item => flattenEmbeddedEvents(item, source, maxDate, output, depth + 1));
      return output;
    }
    if (typeof value !== 'object') return output;

    const title = clean(value.title || value.name || value.eventTitle || value.event_name, 200);
    const dateValue = value.startDate || value.start_date || value.dateStart || value.eventDate || value.date;
    const endValue = value.endDate || value.end_date || value.dateEnd;
    const fecha = parseDateOnly(dateValue) || parseLooseDate(dateValue);
    const fechaFin = parseDateOnly(endValue) || parseLooseDate(endValue);
    const description = clean(value.description || value.summary || value.subtitle || value.excerpt, 1000);
    if (title.length >= 6 && fecha && EVENT_KEYWORDS.test(`${title} ${description}`)) {
      const event = baseEvent(
        source,
        title,
        description || title,
        { fecha, fechaFin },
        value.url || value.href || value.slug || source.url,
        embeddedLocation(value.location || value.venue || value.place, source.ubicacion),
        value.image?.url || value.image || value.thumbnail,
        86
      );
      if (inWindow(event, maxDate)) output.push(event);
    }
    Object.values(value).forEach(item => flattenEmbeddedEvents(item, source, maxDate, output, depth + 1));
    return output;
  }

  function extractEmbeddedJson(doc, source, maxDate) {
    if (!source.extractEmbeddedJson) return [];
    const events = [];
    doc.querySelectorAll('script[type="application/json"], script#__NEXT_DATA__').forEach(script => {
      try {
        flattenEmbeddedEvents(JSON.parse(script.textContent), source, maxDate, events);
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
    const limit = source.maxEvents || 20;
    if (source.tipo === 'RSS') return uniqueEvents(extractRss(html, source, maxDate), limit);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let direct = [];
    if (source.id === 'biblioteca-nacional' || source.id === 'patrimonio-cultural' || source.extractor === 'HERITAGE') direct = extractHeritage(doc, source, maxDate);
    else if (source.id === 'bibliotecas-providencia' || source.extractor === 'PROVIDENCIA') direct = extractProvidencia(doc, source, maxDate);
    else if (source.id === 'hoy-jugue') direct = extractHoyJuegue(doc, source, maxDate);
    else if (source.extractor === 'LA_TERCERA_FINDE') direct = extractLaTerceraFinde(doc, source, maxDate);
    else if (source.extractor === 'PRODUCT_DETAIL') direct = extractProductDetail(doc, source, maxDate);
    else if (source.extractor === 'DATE_GROUPS') direct = extractDateGroups(doc, source, maxDate);
    else if (source.extractor === 'DATED_HEADINGS') direct = extractDatedHeadings(doc, source, maxDate);
    const strictExtractor = source.extractor === 'PRODUCT_DETAIL' || source.extractor === 'DATE_GROUPS';
    if (!direct.length && !strictExtractor) direct = extractGeneric(doc, source, maxDate);
    let combined = uniqueEvents([...direct, ...extractJsonLd(doc, source, maxDate), ...extractEmbeddedJson(doc, source, maxDate)], limit);
    if (!combined.length && source.recurringEvents?.length) combined = uniqueEvents(extractRecurringEvents(source, maxDate), limit);
    return combined;
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
        const allowedPath = source.detailPathPrefix
          ? url.pathname.startsWith(source.detailPathPrefix)
          : /\/eventos?\//i.test(url.pathname);
        url.hash = '';
        if (!allowedPath || seen.has(url.toString())) return;
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
