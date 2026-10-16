import { isMocSearchEngineId } from './mocWebQuery';
import { enhanceMocResultImage, getMocResultNumber } from './mocSearchImages';

// Only documented Search Element APIs/callbacks are used here:
// https://developers.google.com/custom-search/docs/element
export function createMocSearchRuntime(options = {}) {
  const win = options.window || (typeof window !== 'undefined' ? window : null);
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  const timeoutMs = options.timeoutMs || 15000;
  const listeners = new Map();
  let loading = null;
  let engineId = null;

  function dispatch(kind, args) {
    const handler = listeners.get(args[0]);
    if (handler && typeof handler[kind] === 'function') return handler[kind](...args);
    return kind === 'starting' ? args[1] : undefined;
  }

  return {
    subscribe(name, callbacks) {
      listeners.set(name, callbacks);
      return function() {
        if (listeners.get(name) === callbacks) listeners.delete(name);
      };
    },
    load(id) {
      id = String(id || '').trim();
      if (!win || !doc || !isMocSearchEngineId(id)) return Promise.reject(new Error('MOC_SEARCH_NOT_CONFIGURED'));
      if (loading) {
        return engineId === id ? loading : Promise.reject(new Error('MOC_SEARCH_ENGINE_CONFLICT'));
      }
      const existing = doc.querySelector('script[data-lego-moc-search]');
      if (existing) return Promise.reject(new Error('MOC_SEARCH_ENGINE_CONFLICT'));
      engineId = id;
      let script;
      let config;
      const pending = new Promise(function(resolve, reject) {
        let finished = false;
        let timer;
        function settle(error) {
          if (finished) return;
          const api = win.google && win.google.search && win.google.search.cse && win.google.search.cse.element;
          if (!error && (!api || typeof api.render !== 'function' || typeof api.getElement !== 'function')) return;
          finished = true;
          clearTimeout(timer);
          if (error) reject(error);
          else resolve(api);
        }
        config = {
          parsetags: 'explicit',
          initializationCallback: function() { settle(); },
          searchCallbacks: { web: {
            starting: function(...args) { return dispatch('starting', args); },
            ready: function(...args) {
              const suppressStaleResults = dispatch('ready', args) === true;
              // Preserve Google's standard results, promotions, ads,
              // attribution, result estimate, and pagination.
              return suppressStaleResults;
            },
            rendered: function(...args) { dispatch('rendered', args); },
          } },
        };
        win.__gcse = config;
        script = doc.createElement('script');
        script.async = true;
        script.dataset.legoMocSearch = id;
        script.src = 'https://cse.google.com/cse.js?' + new URLSearchParams({ cx: id }).toString();
        script.onerror = function() { settle(new Error('MOC_SEARCH_SCRIPT_FAILED')); };
        script.onload = function() { settle(); };
        timer = setTimeout(function() { settle(new Error('MOC_SEARCH_LOAD_TIMEOUT')); }, timeoutMs);
        doc.head.appendChild(script);
      });
      loading = pending.catch(function(error) {
        if (script) script.remove();
        if (win.__gcse === config) delete win.__gcse;
        loading = null;
        engineId = null;
        throw error;
      });
      return loading;
    },
  };
}

// These DOM nodes come directly from Google's documented rendered callback.
// No search HTML is downloaded, parsed, or republished by the application.
export function styleMocSearchCards(resultElements, resultData = [], imageLabels = {}) {
  (resultElements || []).forEach(function(element, index) {
    if (!element || !element.classList) return;
    element.classList.add('moc-web-result-card');
    if (element.parentElement) element.parentElement.classList.add('moc-web-result-grid');
    const result = resultData[index];
    const mocNumber = getMocResultNumber(result);
    if (!mocNumber) return;
    let number = element.querySelector('.moc-web-result-number');
    if (!number) {
      number = element.ownerDocument.createElement('span');
      number.className = 'moc-web-result-number';
      element.prepend(number);
    }
    number.textContent = mocNumber;
    enhanceMocResultImage(element, result, imageLabels);
  });
}

export const mocSearchRuntime = createMocSearchRuntime();
