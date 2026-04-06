var LEGO_API = 'https://services.slingshot.lego.com/api/v4/lego_historic_product_read/_search';
var LEGO_API_KEY = 'p0OKLXd8US1YsquudM1Ov9Ja7H91jhamak9EMrRB';
var CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
];
var insCache = {};
var pendingFetches = {};

export function getLegoPageUrl(setNum) {
  return 'https://www.lego.com/en-us/service/building-instructions/' + (setNum ? setNum.replace(/-.*$/, '') : '');
}

function buildQuery(productNumber) {
  return JSON.stringify({
    _source: ['product_versions'],
    from: 0,
    size: 1,
    query: {
      bool: {
        must: [
          { term: { product_number: productNumber } }
        ]
      }
    }
  });
}

function parseResponse(data) {
  var instructions = [];

  // Elasticsearch response: hits.hits[]._source.product_versions[]
  var hits = (data && data.hits && data.hits.hits) || [];

  hits.forEach(function(hit) {
    var source = hit._source || hit;
    var versions = source.product_versions || source.productVersions || [];

    versions.forEach(function(version) {
      var bis = version.building_instructions || version.buildingInstructions || [];

      bis.forEach(function(bi) {
        // PDF URL - check multiple possible field paths
        var url = '';
        if (bi.file && bi.file.url) {
          url = bi.file.url;
        } else if (bi.pdfLocation) {
          url = bi.pdfLocation;
        } else if (bi.url) {
          url = bi.url;
        }
        if (!url) return;

        // Skip alternative builds
        var isAlt = bi.isAlternative || bi.is_alternative || false;
        if (isAlt) return;

        // Sequence info
        var seq = 1;
        var tot = 1;
        if (bi.sequence) {
          seq = bi.sequence.element || bi.sequence.index || 1;
          tot = bi.sequence.total || bi.sequence.count || 1;
        }

        // Also try parsing from description (e.g. "BI 3103, 176+4/65+200G, 10278 V39 1/2")
        var desc = bi.description || '';
        var seqMatch = desc.match(/(\d+)\s*\/\s*(\d+)\s*$/);
        if (seqMatch) {
          seq = parseInt(seqMatch[1], 10);
          tot = parseInt(seqMatch[2], 10);
        }

        instructions.push({
          url: url,
          description: desc,
          sequence: seq,
          total: tot,
        });
      });
    });
  });

  // Also try non-Elasticsearch flat response format as fallback
  if (instructions.length === 0) {
    var products = data.products || data.results || [];
    if (!Array.isArray(products)) products = [products];

    products.forEach(function(product) {
      var versions = product.product_versions || product.productVersions || [];
      versions.forEach(function(version) {
        var bis = version.building_instructions || version.buildingInstructions || [];
        bis.forEach(function(bi) {
          var url = bi.pdfLocation || (bi.file && bi.file.url) || bi.url || '';
          if (!url || bi.isAlternative) return;
          var seq = 1, tot = 1;
          if (bi.sequence) { seq = bi.sequence.element || 1; tot = bi.sequence.total || 1; }
          var desc = bi.description || '';
          var seqMatch = desc.match(/(\d+)\s*\/\s*(\d+)\s*$/);
          if (seqMatch) { seq = parseInt(seqMatch[1], 10); tot = parseInt(seqMatch[2], 10); }
          instructions.push({ url: url, description: desc, sequence: seq, total: tot });
        });
      });
    });
  }

  // Sort by sequence
  instructions.sort(function(a, b) { return a.sequence - b.sequence; });

  // Remove duplicates by URL
  var seen = {};
  return instructions.filter(function(ins) {
    if (seen[ins.url]) return false;
    seen[ins.url] = true;
    return true;
  });
}

async function tryFetch(proxyPrefix, productNumber) {
  var url = proxyPrefix + LEGO_API;
  var body = buildQuery(productNumber);

  var res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LEGO_API_KEY,
    },
    body: body,
  });

  if (!res.ok) throw new Error('HTTP ' + res.status);
  var data = await res.json();
  return parseResponse(data);
}

export async function fetchInstructions(setNum) {
  var num = setNum ? setNum.replace(/-.*$/, '') : '';
  if (!num) return [];
  if (insCache[num]) return insCache[num];
  if (pendingFetches[num]) return pendingFetches[num];

  pendingFetches[num] = (async function() {
    // Try each proxy option (direct first, then CORS proxy)
    for (var i = 0; i < CORS_PROXIES.length; i++) {
      try {
        var result = await tryFetch(CORS_PROXIES[i], num);
        if (result.length > 0) {
          insCache[num] = result;
          return result;
        }
      } catch(e) {
        // Try next proxy
        continue;
      }
    }
    return [];
  })();

  var result = await pendingFetches[num];
  delete pendingFetches[num];
  return result;
}
