(function () {
  const CHANNEL = QHSDiscovery.CHANNEL;

  function sendRuntime(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ channel: CHANNEL, ...message }, response => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) return reject(new Error(runtimeError.message));
        if (!response?.ok) return reject(new Error(response?.error || 'La extensión no pudo completar la operación'));
        resolve(response);
      });
    });
  }

  function reply(requestId, payload) {
    window.postMessage({
      channel: CHANNEL,
      direction: 'extension-to-page',
      requestId,
      ...payload
    }, window.location.origin);
  }

  async function runDiscovery(sourceIds, requestId) {
    const selected = QHSDiscovery.SOURCES.filter(source => sourceIds.includes(source.id));
    if (!selected.length) throw new Error('No se seleccionaron fuentes válidas');
    if (selected.length > 50) throw new Error('Máximo 50 fuentes por búsqueda');

    const results = [];
    for (let index = 0; index < selected.length; index += 1) {
      const source = selected[index];
      reply(requestId, {
        progress: true,
        completed: index,
        total: selected.length,
        sourceName: source.nombre
      });
      try {
        const fetched = await sendRuntime({ type: 'FETCH_SOURCE', sourceId: source.id });
        const extractionSource = { ...source, url: fetched.url };
        let events = source.detailsOnly ? [] : QHSDiscovery.extractSource(fetched.html, extractionSource);
        if (source.followEventLinks) {
          const detailUrls = QHSDiscovery.eventDetailUrls(fetched.html, extractionSource, source.detailLimit || 12);
          for (const detailUrl of detailUrls) {
            try {
              const detail = await sendRuntime({ type: 'FETCH_DETAIL', sourceId: source.id, url: detailUrl });
              events.push(...QHSDiscovery.extractSource(detail.html, { ...source, url: detail.url }));
            } catch (_) {}
          }
          events = QHSDiscovery.mergeEvents(events, source.maxEvents || 20);
        }
        results.push({
          sourceId: source.id,
          nombre: source.nombre,
          encontrados: events.length,
          nuevos: events.length,
          estado: 'OK',
          iaUsada: false,
          iaNoDisponible: false,
          error: null,
          events
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          nombre: source.nombre,
          encontrados: 0,
          nuevos: 0,
          estado: 'ERROR',
          iaUsada: false,
          iaNoDisponible: false,
          error: QHSDiscovery.friendlyError(error),
          events: []
        });
      }
    }
    return QHSDiscovery.aggregateResults(results);
  }

  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data;
    if (message?.channel !== CHANNEL || message.direction !== 'page-to-extension' || !message.requestId) return;

    try {
      if (message.type === 'PING') {
        const status = await sendRuntime({ type: 'PING' });
        return reply(message.requestId, { ok: true, version: status.version });
      }
      if (message.type === 'LIST_SOURCES') {
        const result = await sendRuntime({ type: 'LIST_SOURCES' });
        return reply(message.requestId, { ok: true, sources: result.sources });
      }
      if (message.type === 'RUN_DISCOVERY') {
        const result = await runDiscovery(Array.isArray(message.sourceIds) ? message.sourceIds : [], message.requestId);
        return reply(message.requestId, { ok: true, result });
      }
    } catch (error) {
      reply(message.requestId, { ok: false, error: QHSDiscovery.friendlyError(error) });
    }
  });
})();
