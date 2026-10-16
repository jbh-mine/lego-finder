import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading } from '../components/Loading';
import { searchSets, getSetDetail } from '../utils/api';
import { translateSearchQuery, getIpSearchTerms } from '../utils/searchDict';
import { recomputeForPeriod, computePriceScenario, SUPPORTED_PERIODS } from '../utils/scarcityProjection';
import { lookupObservedMarket, lookupReferencePrice, marketHistory, observedExamples } from '../utils/scarcityData';
import scarcityCopy from '../data/scarcityCopy';
import useMarketData from '../utils/useMarketData';
import { marketFromApi } from '../utils/marketApi';

const PERIOD_STORAGE_KEY = 'lego_scarcity_period';
const card = { background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #ddd)', borderRadius: 8, padding: 18, marginBottom: 16 };
const columns = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18 };
const muted = { color: 'var(--color-text-secondary, #666)', fontSize: '0.85rem', lineHeight: 1.6 };
const button = { padding: '10px 16px', borderRadius: 6, border: '1px solid #0066cc', background: '#0066cc', color: '#fff', cursor: 'pointer' };
const field = { padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border, #ccc)', background: 'var(--color-surface, #fff)', color: 'var(--color-text, #222)', minWidth: 0 };

function initialPeriod() {
  try { const value = Number(localStorage.getItem(PERIOD_STORAGE_KEY)); if (SUPPORTED_PERIODS.includes(value)) return value; } catch (error) {}
  return 3;
}
function substitute(text, values) { return text.replace(/\{(\w+)\}/g, (_, key) => values[key]); }

function ScarcityPage() {
  const { lang } = useLanguage();
  const text = scarcityCopy[lang] || scarcityCopy.ko;
  const [params] = useSearchParams();
  const [input, setInput] = useState(params.get('setNum') || params.get('q') || '');
  const [period, setPeriod] = useState(initialPeriod);
  const [raw, setRaw] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [annualRate, setAnnualRate] = useState('0');
  const [fee, setFee] = useState('0');
  const [costs, setCosts] = useState('0');
  const api = useMarketData(raw && raw.setNum);
  const [serverInput, setServerInput] = useState(api.server);
  const [serverError, setServerError] = useState('');
  const [snapshotMode, setSnapshotMode] = useState(false);
  const request = useRef(0);
  const money = value => Number.isFinite(value)
    ? new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value)
    : text.missing;
  const dateTime = value => {
    if (!value) return text.missing;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(date) + ' KST'
      : text.missing;
  };

  async function analyze(value) {
    const ticket = ++request.current;
    setBusy(true); setError(''); setRaw(null); setSnapshotMode(false);
    try {
      const setNum = /-\d+$/.test(value) ? value : value + '-1';
      const detail = await getSetDetail(setNum);
      if (ticket !== request.current) return;
      const market = lookupObservedMarket(setNum);
      setRaw({ setNum, name: detail.name, year: detail.year, numParts: detail.num_parts, imgUrl: detail.set_img_url,
        msrp: lookupReferencePrice(setNum, market), market, marketHistory: marketHistory(market) });
      setInput(setNum); setAnnualRate('0'); setFee('0'); setCosts('0');
    } catch (failure) { if (ticket === request.current) setError(text.failed); }
    finally { if (ticket === request.current) setBusy(false); }
  }

  async function search(value) {
    const ticket = ++request.current;
    setBusy(true); setError(''); setRaw(null); setResults([]); setSearched(true);
    try {
      const translated = translateSearchQuery(value);
      const queries = [...new Set([translated, value, ...(getIpSearchTerms(value) || getIpSearchTerms(translated) || [])].filter(Boolean))].slice(0, 5);
      const responses = await Promise.allSettled(queries.map(query => searchSets(query, 1, 60)));
      if (responses.every(response => response.status === 'rejected')) throw new Error('Search unavailable');
      const merged = new Map();
      responses.forEach(response => {
        if (response.status === 'fulfilled') response.value.results.forEach(set => merged.set(set.set_num, set));
      });
      if (ticket === request.current) setResults([...merged.values()].sort((a, b) => b.year - a.year).slice(0, 60));
    } catch (failure) { if (ticket === request.current) setError(text.failed); }
    finally { if (ticket === request.current) setBusy(false); }
  }

  useEffect(() => {
    if (params.get('setNum')) analyze(params.get('setNum'));
    else if (params.get('q')) search(params.get('q'));
    return () => { request.current++; };
    // Initial URL selection; subsequent requests come from the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changePeriod(value) {
    setPeriod(value);
    try { localStorage.setItem(PERIOD_STORAGE_KEY, String(value)); } catch (failure) {}
  }
  function submit(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    if (/^\d+(?:-\d+)?$/.test(value)) { setSearched(false); analyze(value); }
    else search(value);
  }
  let selected = raw;
  if (raw && api.server && !snapshotMode) {
    const live = api.response ? marketFromApi({ ...api.response, status: api.expired ? 'stale' : api.response.status }) : null;
    selected = { ...raw, evidenceKind: 'daily-market-observations', market: live, msrp: lookupReferencePrice(raw.setNum, live), marketHistory: marketHistory(live) };
  }
  const analysis = selected ? recomputeForPeriod(selected, period) : null;
  const market = analysis && analysis.market;
  const reference = analysis && analysis.msrp;
  const score = analysis && analysis.score;
  const forecast = analysis && analysis.forecast;
  const liveMode = Boolean(api.server && !snapshotMode);
  const isApi = Boolean(market && market.provider === 'bricklink');
  function apiError(failure) { return failure ? (text.apiErrors[failure.code] || text.apiErrors.CONNECTION_FAILED) : ''; }
  const scenario = computePriceScenario(market && market.value, period, { annualRatePct: annualRate, feePct: fee, fixedCosts: costs });
  const chartAxes = <><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.3)" />
    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} /><YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={value => Math.round(value / 1000) + 'k'} />
    <Tooltip formatter={value => Array.isArray(value) ? value.map(money).join(' – ') : money(value)} contentStyle={{ background: '#222', color: '#fff', borderRadius: 6 }} /><Legend /></>;
  function stat(label, value, note) {
    return <div><div style={muted}>{label}</div><div style={{ fontWeight: 700, fontSize: '1.25rem', margin: '5px 0' }}>{value == null ? text.missing : value}</div>{note && <div style={muted}>{note}</div>}</div>;
  }

  return <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 16px' }}>
    <h1>{text.title}</h1><p style={muted}>{text.description}</p>
    <section style={card} aria-label={text.serverPanel}><h2>{text.serverPanel}</h2>
      <p style={muted}>{text.serverNote}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="url" aria-label={text.serverUrl} placeholder="https://market.example.com" value={serverInput}
          onChange={event => { setServerInput(event.target.value); setServerError(''); }} style={{ ...field, flex: '1 1 280px' }} />
        <button style={button} onClick={() => { try { setServerInput(api.save(serverInput)); setServerError(''); setSnapshotMode(false); } catch (failure) { setServerError(apiError(failure)); } }}>{text.saveServer}</button>
        <button style={button} disabled={api.testing || !serverInput.trim()} onClick={() => api.test(serverInput)}>{api.testing ? text.connecting : text.testServer}</button>
        <button style={field} disabled={!api.server} onClick={() => { api.save(''); setServerInput(''); setSnapshotMode(false); }}>{text.disconnect}</button>
      </div>
      <p role="status">{api.server ? text.serverConfigured : text.serverAbsent}
        {api.health && (api.health.error ? ' · ' + apiError(api.health.error) : ' · ' + (api.health.configured ? text.serverReady : text.apiErrors.NOT_CONFIGURED))}</p>
      {serverError && <p role="alert">{serverError}</p>}
      <a href="https://github.com/jbh-mine/lego-finder/blob/main/docs/MARKET_API_SETUP.md" target="_blank" rel="noopener noreferrer">{text.setupGuide}</a>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        <label>{text.itemCondition} <select aria-label={text.itemCondition} value={api.condition} onChange={event => { api.setCondition(event.target.value); setSnapshotMode(false); }} style={field}>
          <option value="N">{text.newCondition}</option><option value="U">{text.usedCondition}</option></select></label>
        <label>{text.sellerScope} <select aria-label={text.sellerScope} value={api.country} onChange={event => { api.setCountry(event.target.value); setSnapshotMode(false); }} style={field}>
          <option value="GLOBAL">{text.globalScope}</option><option value="KR">{text.krScope}</option></select></label>
      </div><p style={muted}>{text.scopeNote}</p>
    </section>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}><span style={muted}>{text.examples}:</span>
      {observedExamples().map(example => <button key={example.number} style={{ ...field, cursor: 'pointer' }} disabled={busy}
        title={example.name} aria-label={example.number + ' ' + example.name} onClick={() => analyze(example.number)}>{example.number}</button>)}
    </div>
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <input aria-label={text.input} placeholder={text.input} value={input} onChange={event => setInput(event.target.value)} style={{ ...field, flex: '1 1 240px' }} />
      <button type="submit" style={button} disabled={busy || !input.trim()}>{text.search}</button>
    </form>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}><span>{text.period}</span>
      {SUPPORTED_PERIODS.map(years => <button key={years} type="button" aria-pressed={period === years} onClick={() => changePeriod(years)}
        style={{ ...button, background: period === years ? '#0066cc' : 'transparent', color: period === years ? '#fff' : '#4a9eff' }}>{years}{text.years}</button>)}
    </div>
    {busy && <Loading message={text.searching} />}
    {error && <p role="alert" style={card}>{error}</p>}
    {!busy && !raw && searched && !error && <section style={card}>
      <h2>{results.length ? text.choose : text.noResults}</h2>
      {results.map(set => <button key={set.set_num} onClick={() => analyze(set.set_num)} style={{ ...field, display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 6, textAlign: 'left', cursor: 'pointer' }}>
        {set.set_img_url && <img src={set.set_img_url} alt="" width="64" height="48" style={{ objectFit: 'contain' }} />}
        <span>{set.set_num} · {set.name}</span></button>)}
    </section>}
    {analysis && !busy && <>
      {results.length > 0 && <button style={button} onClick={() => setRaw(null)}>{text.back}</button>}
      <section style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        {analysis.imgUrl && <img src={analysis.imgUrl} alt={analysis.name} width="120" height="90" style={{ objectFit: 'contain' }} />}
        <div><div style={muted}>{analysis.setNum}</div><h2 style={{ margin: '4px 0' }}>{analysis.name}</h2>
          <div style={muted}>{analysis.year} · {analysis.numParts.toLocaleString()} pcs</div><Link to={'/set/' + analysis.setNum}>{text.detail}</Link></div>
      </section>
      <section style={card}>
        <strong>{liveMode ? text.liveMode : text.snapshotMode}</strong>
        {liveMode && <><p style={muted}>{text.autoRefresh}</p>
          <button style={button} disabled={api.loading || api.cooldownSeconds > 0} onClick={api.refresh}>{api.loading ? text.marketLoading : text.refreshMarket}</button>
          {api.cooldownSeconds > 0 && <span style={{ ...muted, marginLeft: 10 }}>{substitute(text.cooldown, { n: Math.ceil(api.cooldownSeconds / 60) })}</span>}
          {api.error && <p role="alert">{apiError(api.error)}</p>}
          {api.response && <p style={muted}>{text.expires}: {dateTime(api.response.expiresAt)}</p>}
        </>}
        {api.server && raw.market && (api.error || snapshotMode) && <button style={{ ...field, marginTop: 10 }} onClick={() => setSnapshotMode(value => !value)}>{snapshotMode ? text.returnLive : text.viewSnapshot}</button>}
        {!liveMode && <p style={muted}>{text.snapshotFallback}</p>}
        {isApi && market.stale && <p role="status">{text.staleApi}</p>}
        {isApi && market.status === 'no-sales' && <p role="status">{text.noSales}</p>}
        {isApi && api.response.refresh.state !== 'ok' && <p role="status">{text.refreshStates[api.response.refresh.state]}</p>}
        {isApi && api.response.refresh.errorCode && <p role="status">{apiError({ code: api.response.refresh.errorCode })}</p>}
      </section>
      <section style={card}><div style={columns}>
        {stat(reference ? text[reference.kind === 'platform-release' ? 'platformRelease' : reference.kind === 'converted-reference' ? 'converted' : 'storedReference'] : text.reference,
          money(reference && reference.value), reference ? dateTime(reference.observedAt) : '')}
        {stat(text.market, money(market && market.value), market ? substitute(isApi ? text.apiMedian : text.median, { n: market.sampleCount }) : '')}
        {stat(text.premium, score.available ? (score.returnPct >= 0 ? '+' : '') + score.returnPct + '%' : text.missing)}
        {stat(text.index, score.available ? score.finalScore + ' / 100' : text.missing, text.indexNote)}
      </div>
        {reference && <p style={muted}>{text[reference.kind === 'platform-release' ? 'referenceNote' : reference.kind === 'converted-reference' ? 'convertedNote' : 'unverifiedNote']} {reference.source} {reference.usd ? ' · USD $' + reference.usd : ''}</p>}
        {!market && <p role="status">{liveMode && api.loading ? text.marketLoading : text.noMarket}</p>}
      </section>
      {market && <section style={card}>
        <p><strong>{market.source}</strong> · {text.asOf}: {dateTime(market.observedAt)}</p>
        <p style={muted}>{isApi ? text.apiEvidence : text.snapshot} {isApi ? (market.condition === 'N' ? text.newCondition : text.usedCondition) + ' · ' + (market.country === 'KR' ? text.krScope : text.globalScope) + ' · KRW' : market.condition && /unspecified|unknown/i.test(market.condition) ? text.conditionUnknown : market.conditionLabel || market.condition}</p>
        {isApi && <p style={muted}>{text.scopeNote}</p>}
        {market.latestTradeAgeDays > 30 && <p role="status" style={{ color: 'var(--color-info-text, #a66200)' }}>{substitute(text.staleTrade, { days: market.latestTradeAgeDays })}</p>}
        {market.snapshotAgeDays > 30 && <p role="status">{substitute(text.staleSnapshot, { days: market.snapshotAgeDays })}</p>}
        <a href={market.sourceUrl} target="_blank" rel="noopener noreferrer">{text.source}</a>
        {isApi && <p style={muted}>{text.bricklinkNotice}</p>}
        <div style={{ ...columns, marginTop: 18 }}>
          {stat(isApi ? text.latestOrder : text.latest, money(market.latest), market.latestDateLabel)}
          {stat(isApi ? text.lowestAsking : text.asking, money(market.askingPriceKrw), text.askNote)}
          {stat(text.range, money(market.min) + ' – ' + money(market.max))}
          {isApi ? stat(text.sixMonthLots, market.sixMonthLots, text.lotsNote) : stat(text.total, Number.isFinite(market.totalTradeCount) ? market.totalTradeCount.toLocaleString() : text.missing, text.totalNote)}
        </div>
        {isApi && <div style={{ ...columns, marginTop: 18 }}>{stat(text.sixMonthAverage, money(market.sixMonthAverage))}
          {stat(text.quantityAverage, money(market.sixMonthQuantityAverage))}{stat(text.sixMonthUnits, market.sixMonthUnits)}{stat(text.askingLots, market.askingLots)}</div>}
        <h3>{isApi ? text.providerRows : text.trades}</h3>{isApi && <p style={muted}>{text.orderDateNote}</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left' }}>{isApi ? text.orderDate : text.tradeDate}</th><th style={{ textAlign: 'right' }}>{text.price}</th></tr></thead>
          <tbody>{market.trades.map((trade, index) => <tr key={index}><td style={{ padding: '8px 0' }}>{trade.date || trade.dateLabel || text.missing}</td><td style={{ textAlign: 'right' }}>{money(trade.price)}</td></tr>)}</tbody></table>
        {market.trades.some(trade => !trade.date) && <p style={muted}>{text.relativeNote}</p>}
      </section>}
      {analysis.pastSeries.length > 0 && <section style={card}><h3>{isApi ? text.dailyHistory : text.observedHistory}</h3>
        <div style={{ width: '100%', height: 230 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={analysis.pastSeries}>{chartAxes}
          <Line dataKey="market" name={text.price} stroke="#4a9eff" strokeWidth={0} dot={{ r: 5 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><p style={muted}>{isApi ? text.dailyHistoryNote : text.historyNote}</p></section>}
      <section style={card}><h3>{text.forecast}</h3>
        <p>{substitute(liveMode ? text.apiHistoryCount : text.historyCount, { n: forecast.count, months: forecast.monthCount || 0, days: forecast.spanDays })}</p>
        {!forecast.available ? <><strong>{text.unavailable}</strong><p>{forecast.reasons.map(reason => text.forecastReasons[reason]).join(' · ')}</p><p style={muted}>{liveMode ? text.apiForecastRules : text.forecastRules}</p></>
          : <><p>{text.annualTrend}: {forecast.annualRatePct.toFixed(1)}% · {forecast.from} – {forecast.to}</p>
            <div style={{ width: '100%', height: 240 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={forecast.series}>{chartAxes}
              <Area dataKey="range" name={text.modelRange} stroke="none" fill="#4a9eff" fillOpacity={0.2} isAnimationActive={false} />
              <Line dataKey="projected" name={text.modelCenter} stroke="#4a9eff" strokeDasharray="4 4" dot={false} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>
            <p>{money(forecast.series[forecast.series.length - 1].range[0])} – {money(forecast.series[forecast.series.length - 1].range[1])}</p>
            <p style={muted}>{isApi ? text.apiAssumptions : text.forecastAssumptions}</p></>}
      </section>
      {market && market.value > 0 && <section style={card}><h3>{text.scenario}</h3><p style={muted}>{text.scenarioNote}</p><div style={columns}>
        <label>{text.annualRate}<input type="number" step="0.1" value={annualRate} onChange={event => setAnnualRate(event.target.value)} style={{ ...field, display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6 }} /></label>
        <label>{text.fee}<input type="number" min="0" max="100" step="0.1" value={fee} onChange={event => setFee(event.target.value)} style={{ ...field, display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6 }} /></label>
        <label>{text.fixedCosts}<input type="number" min="0" step="1000" value={costs} onChange={event => setCosts(event.target.value)} style={{ ...field, display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6 }} /></label>
      </div>
        {scenario.available ? <><div style={{ ...columns, marginTop: 20 }}>
          {stat(substitute(text.scenarioGross, { years: period }), money(scenario.gross))}{stat(text.scenarioNet, money(scenario.net))}{stat(text.scenarioDifference, money(scenario.difference))}
        </div></> : <p role="alert">{text.invalidScenario}</p>}
        <p style={muted}>{text.scenarioFormula}</p>
      </section>}
      <section style={card}><h3>{text.formula}</h3><p>{liveMode ? text.apiFormulaMedian : text.formulaMedian}</p><p>{text.formulaPremium}</p><p>{text.formulaIndex}</p>
        {liveMode && <p style={muted}>{text.apiComparison}</p>}
        <p style={muted}>{text.formulaNote}</p><details><summary>{text.forecast}</summary><p>{liveMode ? text.apiFormulaModel : text.formulaModel}</p><p>{liveMode ? text.apiAssumptions : text.forecastAssumptions}</p>
          <a href="https://www.itl.nist.gov/div898/handbook/pmd/section5/pmd512.htm" target="_blank" rel="noopener noreferrer">{text.method}</a></details>
      </section>
    </>}
  </div>;
}
export default ScarcityPage;
