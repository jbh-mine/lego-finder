import React, { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { buildMocWebQuery, getMocWebSearchUrl, isMocSearchEngineId, normalizeMocWebQuery } from '../utils/mocWebQuery';
import { mocSearchRuntime, styleMocSearchCards } from '../utils/mocSearchElement';
import './MocWebSearch.css';

const SEARCH_TIMEOUT_MS = 15000;
const COPY = {
  ko: {
    mocWebInputLabel: 'MOC 번호·이름·제작자 검색',
    mocWebLoadingEngine: 'Google MOC 검색을 준비하고 있습니다.',
    mocWebLoadingResults: 'Google에 색인된 MOC를 검색하고 있습니다.',
    mocWebNotConfigured: '사이트 내 웹 검색 설정이 완료되지 않았습니다. Google에서 같은 검색을 열 수 있습니다.',
    mocWebUnavailable: 'Google 검색을 불러오지 못했습니다. 다시 시도하거나 Google에서 같은 검색을 여세요.',
    mocWebEmpty: '이 검색 페이지에 일치하는 MOC가 없습니다. 검색어를 바꾸거나 Google에서 확인하세요.',
    mocWebGoogleFallback: 'Google에서 같은 MOC 검색 열기',
    mocWebScope: 'Google에 색인된 Rebrickable MOC를 검색합니다. 표시된 결과 수는 Google의 추정치이며 전체 작품 수가 아닙니다.',
    searchBtn: '검색', retry: '다시 시도',
  },
  en: {
    mocWebInputLabel: 'Search MOCs by number, name, or designer',
    mocWebLoadingEngine: 'Preparing Google MOC search.',
    mocWebLoadingResults: 'Searching MOCs indexed by Google.',
    mocWebNotConfigured: 'In-page web search is not configured yet. Open the same search on Google.',
    mocWebUnavailable: 'Unable to load Google search. Retry or open the same search on Google.',
    mocWebEmpty: 'No matching MOC on this search page. Change the query or check Google.',
    mocWebGoogleFallback: 'Open the same MOC search on Google',
    mocWebScope: 'Search Google-indexed Rebrickable MOCs. Result counts are Google estimates, not the total number of creations.',
    searchBtn: 'Search', retry: 'Retry',
  },
};

// query/onQueryChange synchronize the draft with a parent. Editing never
// searches on every keystroke; submit runs the search. An initial nonempty
// query runs once after the official Search Element initializes.
function MocWebSearch(props) {
  const { t, lang } = useLanguage();
  const copy = function(key) {
    const translated = t(key);
    return translated !== key ? translated : (COPY[lang] || COPY.ko)[key];
  };
  const id = String(props.searchEngineId || process.env.REACT_APP_MOC_SEARCH_ENGINE_ID || '').trim();
  const configured = isMocSearchEngineId(id);
  const elementName = 'lego-moc-web-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [draft, setDraft] = useState(props.query || '');
  const [search, setSearch] = useState(function() { return { query: normalizeMocWebQuery(props.query), sequence: 0 }; });
  const [status, setStatus] = useState(configured ? 'initializing' : 'unconfigured');
  const [generation, setGeneration] = useState(0);
  const controlRef = useRef(null);
  const queryRef = useRef(search.query);
  const searchTimerRef = useRef(null);
  const resultsRef = useRef([]);
  const activeQueryRef = useRef('');
  const executeRef = useRef(null);
  const hostRef = useRef(null);
  const noResultsRef = useRef(copy('mocWebEmpty'));

  noResultsRef.current = copy('mocWebEmpty');
  queryRef.current = search.query;
  useEffect(function() {
    if (typeof props.query === 'string') setDraft(props.query);
  }, [props.query]);

  useEffect(function() {
    let alive = true;
    let executedSequence = null;
    controlRef.current = null;
    clearTimeout(searchTimerRef.current);
    if (!configured) {
      setStatus('unconfigured');
      return;
    }
    setStatus('initializing');
    const startWaiting = function() {
      clearTimeout(searchTimerRef.current);
      setStatus('searching');
      searchTimerRef.current = setTimeout(function() {
        if (alive) setStatus('error');
      }, SEARCH_TIMEOUT_MS);
    };
    const unsubscribe = mocSearchRuntime.subscribe(elementName, {
      starting: function(name, query) {
        activeQueryRef.current = buildMocWebQuery(query);
        if (alive) startWaiting();
        return activeQueryRef.current;
      },
      ready: function(name, query, promotions, results) {
        if (!alive || buildMocWebQuery(query) !== activeQueryRef.current) return true;
        resultsRef.current = Array.isArray(results) ? results : [];
        return false;
      },
      rendered: function(name, query, promotions, elements) {
        if (!alive || buildMocWebQuery(query) !== activeQueryRef.current) return;
        clearTimeout(searchTimerRef.current);
        styleMocSearchCards(elements, resultsRef.current);
        setStatus(resultsRef.current.length ? 'results' : 'empty');
      },
    });
    const execute = function(nextSearch) {
      if (!alive || !controlRef.current || !nextSearch.query || executedSequence === nextSearch.sequence) return;
      executedSequence = nextSearch.sequence;
      activeQueryRef.current = buildMocWebQuery(nextSearch.query);
      startWaiting();
      try { controlRef.current.execute(activeQueryRef.current); }
      catch (e) {
        clearTimeout(searchTimerRef.current);
        setStatus('error');
      }
    };
    executeRef.current = execute;
    mocSearchRuntime.load(id).then(function(api) {
      if (!alive || !hostRef.current) return;
      api.render({
        div: hostRef.current,
        tag: 'searchresults-only',
        gname: elementName,
        attributes: {
          as_sitesearch: 'rebrickable.com', autoSearchOnLoad: false,
          filter: '1',
          enableImageSearch: false,
          enableHistory: false, linkTarget: '_blank', webSearchResultSetSize: 10,
          noResultsString: noResultsRef.current,
        },
      });
      controlRef.current = api.getElement(elementName);
      if (!controlRef.current || typeof controlRef.current.execute !== 'function') throw new Error('MOC_SEARCH_INITIALIZATION_FAILED');
      setStatus('ready');
      execute({ query: queryRef.current, sequence: search.sequence });
    }).catch(function() { if (alive) setStatus('error'); });
    return function() {
      alive = false;
      unsubscribe();
      clearTimeout(searchTimerRef.current);
      executeRef.current = null;
      controlRef.current = null;
    };
  }, [configured, id, generation, elementName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(function() {
    if (executeRef.current) executeRef.current(search);
  }, [search]);

  const submit = function(event) {
    event.preventDefault();
    if (status === 'searching') return;
    const raw = draft.trim();
    if (!raw) return;
    if (props.onQueryChange) props.onQueryChange(raw);
    setSearch(function(previous) { return { query: normalizeMocWebQuery(raw), sequence: previous.sequence + 1 }; });
    if (!controlRef.current && status === 'error') setGeneration(function(previous) { return previous + 1; });
  };
  const retry = function() {
    setSearch(function(previous) { return { query: normalizeMocWebQuery(draft) || previous.query, sequence: previous.sequence + 1 }; });
    if (!controlRef.current) setGeneration(function(previous) { return previous + 1; });
  };
  const busy = status === 'initializing' || status === 'searching';
  const message = status === 'initializing' ? 'mocWebLoadingEngine'
    : status === 'searching' ? 'mocWebLoadingResults'
    : status === 'unconfigured' ? 'mocWebNotConfigured'
    : status === 'error' ? 'mocWebUnavailable'
    : status === 'empty' ? 'mocWebEmpty' : null;

  return React.createElement('section', { className: 'moc-web-search', 'aria-busy': busy },
    React.createElement('form', { className: 'moc-search-form', onSubmit: submit },
      React.createElement('div', { className: 'search-input-wrapper' },
        React.createElement('input', {
          type: 'search', value: draft, 'aria-label': copy('mocWebInputLabel'), placeholder: copy('mocWebInputLabel'),
          onChange: function(event) {
            setDraft(event.target.value);
            if (props.onQueryChange) props.onQueryChange(event.target.value);
          },
        })
      ),
      React.createElement('button', { type: 'submit', disabled: !draft.trim() || busy || !configured }, copy('searchBtn'))
    ),
    React.createElement('p', { className: 'moc-web-scope' }, copy('mocWebScope')),
    message ? React.createElement('div', { className: 'moc-web-status', role: status === 'error' ? 'alert' : 'status' },
      React.createElement('span', null, copy(message)),
      status === 'error' ? React.createElement('button', { type: 'button', onClick: retry }, copy('retry')) : null
    ) : null,
    React.createElement('div', { ref: hostRef, id: elementName, className: 'moc-web-results' }),
    React.createElement('p', { className: 'moc-web-fallback' }, React.createElement('a', {
      href: getMocWebSearchUrl(draft), target: '_blank', rel: 'noopener noreferrer',
    }, copy('mocWebGoogleFallback')))
  );
}

export default MocWebSearch;
