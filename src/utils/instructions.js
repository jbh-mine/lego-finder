var LEGO_API = 'https://services.slingshot.lego.com/api/v4/lego_historic_product_read/_search';
var LEGO_API_KEY = 'p0OKLXd8US1YsquudM1Ov9Ja7H91jhamak9EMrRB';
var CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
];
var insCache = {};
var pendingFetches = {};

// Generate LEGO official building instructions URL
// Accepts optional legoNum (official product number)
export function getLegoPageUrl(setNum, legoNum) {
  var num = legoNum || (setNum ? setNum.replace(/-.*$/, '') : '');
  return 'https://www.lego.com/ko-kr/service/building-instructions/' + num;
}

// Check if a PDF URL is an "original" file (just digits.pdf)
function isOriginalPdf(url) {
  if (!url) return false;
  var filename = url.split('/').pop().split('?')[0];
  return /^\d+\.pdf$/i.test(filename);
}

// Extract product number from PDF filename (e.g., "4669.pdf" -> "4669")
function extractNumFromUrl(url) {
  if (!url) return '';
  var filename = url.split('/').pop().split('?')[0];
  var match = filename.match(/^(\d+)\.pdf$/i);
  return match ? match[1] : '';
}

function buildQuery(productNumber) {
  return JSON.stringify({
    _source: ['product_versions', 'product_number'],
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
  var legoProductNumber = '';

  var hits = (data && data.hits && data.hits.hits) || [];

  hits.forEach(function(hit) {
    // Try to get LEGO product number from Elasticsearch hit _id
    if (hit._id && !legoProductNumber) {
      legoProductNumber = String(hit._id);
    }
    // Also try from _source.product_number
    var source = hit._source || hit;
    if (source.product_number && !legoProductNumber) {
      legoProductNumber = String(source.product_number);
    }

    var versions = source.product_versions || source.productVersions || [];

    versions.forEach(function(version) {
      var bis = version.building_instructions || version.buildingInstructions || [];

      bis.forEach(function(bi) {
        var url = '';
        if (bi.file && bi.file.url) {
          url = bi.file.url;
        } else if (bi.pdfLocation) {
          url = bi.pdfLocation;
        } else if (bi.url) {
          url = bi.url;
        }
        if (!url) return;

        // Only keep original PDFs (digits-only filename)
        if (!isOriginalPdf(url)) return;

        var isAlt = bi.isAlternative || bi.is_alternative || false;
        if (isAlt) return;

        var seq = 1;
        var tot = 1;
        if (bi.sequence) {
          seq = bi.sequence.element || bi.sequence.index || 1;
          tot = bi.sequence.total || bi.sequence.count || 1;
        }

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

  // Fallback flat response format
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
          if (!isOriginalPdf(url)) return;
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

  // Extract the LEGO product number from the first PDF filename
  // This is the most reliable source (e.g., "4669.pdf" -> "4669")
  if (instructions.length > 0) {
    var pdfNum = extractNumFromUrl(instructions[0].url);
    if (pdfNum) {
      legoProductNumber = pdfNum;
    }
  }

  instructions.sort(function(a, b) { return a.sequence - b.sequence; });

  var seen = {};
  var filtered = instructions.filter(function(ins) {
    if (seen[ins.url]) return false;
    seen[ins.url] = true;
    return true;
  });

  return { instructions: filtered, legoProductNumber: legoProductNumber };
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
  if (!num) return { instructions: [], legoProductNumber: '' };
  if (insCache[num]) return insCache[num];
  if (pendingFetches[num]) return pendingFetches[num];

  pendingFetches[num] = (async function() {
    for (var i = 0; i < CORS_PROXIES.length; i++) {
      try {
        var result = await tryFetch(CORS_PROXIES[i], num);
        if (result.instructions.length > 0) {
          insCache[num] = result;
          return result;
        }
      } catch(e) {
        continue;
      }
    }
    return { instructions: [], legoProductNumber: '' };
  })();

  var result = await pendingFetches[num];
  delete pendingFetches[num];
  return result;
}
