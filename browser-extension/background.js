importScripts('discovery.js');

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12000;

function sourceUrls(source) {
  const today = QHSDiscovery.santiagoDateKey();
  const [year, month] = today.split('-');
  const monthName = QHSDiscovery.SPANISH_MONTHS[Number(month) - 1];
  if (source.id === 'bibliotecas-providencia') {
    return [`https://biblioteca.providencia.cl/provi/${year}-actividades-de-${monthName}`, source.url];
  }
  if (source.id === 'municipalidad-providencia') {
    return [`https://providencia.cl/provi/${year}-actividades-de-${monthName}`, source.url];
  }
  return [source.url];
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_RESPONSE_BYTES) throw new Error('Respuesta demasiado grande');
    const html = await response.text();
    if (html.length > MAX_RESPONSE_BYTES) throw new Error('Respuesta demasiado grande');
    return { html, url: response.url || url };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSource(source) {
  let lastError;
  for (const url of sourceUrls(source)) {
    try {
      return await fetchPage(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No se pudo consultar la fuente');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.channel !== QHSDiscovery.CHANNEL) return false;

  if (message.type === 'PING') {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }

  if (message.type === 'LIST_SOURCES') {
    sendResponse({ ok: true, sources: QHSDiscovery.SOURCES });
    return false;
  }

  if (message.type === 'FETCH_SOURCE') {
    const source = QHSDiscovery.SOURCES.find(item => item.id === message.sourceId);
    if (!source) {
      sendResponse({ ok: false, error: 'Fuente no autorizada' });
      return false;
    }
    fetchSource(source)
      .then(result => sendResponse({ ok: true, ...result }))
      .catch(error => sendResponse({ ok: false, error: QHSDiscovery.friendlyError(error) }));
    return true;
  }

  if (message.type === 'FETCH_DETAIL') {
    const source = QHSDiscovery.SOURCES.find(item => item.id === message.sourceId && item.followEventLinks);
    if (!source) {
      sendResponse({ ok: false, error: 'Fuente de detalle no autorizada' });
      return false;
    }
    let detailUrl;
    try {
      detailUrl = new URL(String(message.url || ''), source.url);
      const sourceUrl = new URL(source.url);
      if (detailUrl.protocol !== 'https:' || detailUrl.origin !== sourceUrl.origin) throw new Error('URL de detalle no autorizada');
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
      return false;
    }
    fetchPage(detailUrl.toString())
      .then(result => sendResponse({ ok: true, ...result }))
      .catch(error => sendResponse({ ok: false, error: QHSDiscovery.friendlyError(error) }));
    return true;
  }

  return false;
});
