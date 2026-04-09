#!/usr/bin/env node
/**
 * promote-bdp-upcoming.js
 *
 * Migration script — moves entries from src/data/bdpUpcoming.json into
 * src/data/prices.json when they satisfy BOTH:
 *   - status === 'confirmed'
 *   - expectedLaunchDate has passed (<= today)
 *
 * Each promoted entry is added (or merged) into prices.json using an auto
 * assigned BDP id (910xxx range) if the curator did not provide a real
 * LEGO set number. The original bdpUpcoming.json entry is then removed so
 * it no longer appears on the "Upcoming" tab.
 *
 * Usage:
 *   node scripts/promote-bdp-upcoming.js           # dry-run (no writes)
 *   node scripts/promote-bdp-upcoming.js --apply   # actually rewrite files
 *
 * Intended to run weekly via .github/workflows/auto-update-images.yml.
 *
 * NOTE: Because pricing is not known at promotion time (KRW is only set
 * after KREAM / LEGO KR publish the final price), promoted entries are
 * inserted with `price: 0` and a `needsPriceVerification: true` flag so
 * the operator knows to back-fill them.
 */

/* eslint-disable no-console */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var UPCOMING_PATH = path.join(ROOT, 'src', 'data', 'bdpUpcoming.json');
var PRICES_PATH = path.join(ROOT, 'src', 'data', 'prices.json');

var APPLY = process.argv.indexOf('--apply') !== -1;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function todayIso() {
  var d = new Date();
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var dd = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

function nextAvailableBdpId(prices) {
  // BDP entries traditionally use the 910001..910999 range.
  var maxId = 910000;
  Object.keys(prices.prices || {}).forEach(function(key) {
    var n = parseInt(key, 10);
    if (!isNaN(n) && n >= 910001 && n <= 910999 && n > maxId) {
      maxId = n;
    }
  });
  return String(maxId + 1);
}

function main() {
  if (!fs.existsSync(UPCOMING_PATH)) {
    console.log('[promote-bdp] bdpUpcoming.json not found, nothing to do.');
    return;
  }
  if (!fs.existsSync(PRICES_PATH)) {
    console.log('[promote-bdp] prices.json not found, aborting.');
    process.exit(1);
  }

  var upcomingDoc = readJson(UPCOMING_PATH);
  var prices = readJson(PRICES_PATH);

  if (!prices.prices) prices.prices = {};

  var today = todayIso();
  var upcoming = (upcomingDoc.upcoming || []).slice();

  var toPromote = upcoming.filter(function(item) {
    return item.status === 'confirmed'
      && typeof item.expectedLaunchDate === 'string'
      && item.expectedLaunchDate <= today;
  });

  if (toPromote.length === 0) {
    console.log('[promote-bdp] No confirmed+past entries to promote. (today=' + today + ')');
    return;
  }

  console.log('[promote-bdp] ' + toPromote.length + ' entries eligible for promotion:');

  var remaining = upcoming.filter(function(item) {
    return toPromote.indexOf(item) === -1;
  });

  toPromote.forEach(function(item) {
    var id = nextAvailableBdpId(prices);
    var nameEn = item.nameEn || item.nameKo || ('BDP ' + item.round);
    var year = parseInt((item.expectedLaunchDate || today).slice(0, 4), 10);

    var entry = {
      theme: 'bdp',
      year: year,
      price: 0,
      name: nameEn,
      designer: item.designer || null,
      round: item.round || null,
      priceFromUsd: true,
      usd: item.estimatedUsd || null,
      needsPriceVerification: true,
      promotedFrom: item.id,
      promotedAt: today
    };

    prices.prices[id] = entry;
    console.log('  - ' + item.id + ' (' + nameEn + ') -> prices[' + id + ']');
  });

  upcomingDoc.upcoming = remaining;
  if (!upcomingDoc.meta) upcomingDoc.meta = {};
  upcomingDoc.meta.lastUpdated = today;

  if (!APPLY) {
    console.log('[promote-bdp] Dry-run complete. Re-run with --apply to write changes.');
    return;
  }

  writeJson(PRICES_PATH, prices);
  writeJson(UPCOMING_PATH, upcomingDoc);
  console.log('[promote-bdp] Applied. Wrote ' + PRICES_PATH + ' and ' + UPCOMING_PATH + '.');
}

try {
  main();
} catch (e) {
  console.error('[promote-bdp] Failed:', e);
  process.exit(1);
}
