var LEGO_API = 'https://services.slingshot.lego.com/api/v4/lego_historic_product_read/_search';
var insCache = {};
var pendingFetches = {};

export function getLegoPageUrl(setNum) {
  return 'https://www.lego.com/en-us/service/building-instructions/' + (setNum ? setNum.replace(/-.*$/, '') : '');
}

export async function fetchInstructions(setNum) {
  var num = setNum ? setNum.replace(/-.*$/, '') : '';
  if (!num) return [];
  if (insCache[num]) return insCache[num];
  if (pendingFetches[num]) return pendingFetches[num];

  pendingFetches[num] = (async function() {
    try {
      var res = await fetch(LEGO_API + '?q=' + encodeURIComponent(num) + '&size=500&offset=0');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var instructions = [];

      var products = data.products || data.results || [];
      if (!Array.isArray(products)) products = [products];

      products.forEach(function(product) {
        var pNum = product.productId || product.product_number || product.productNumber || '';
        if (pNum && String(pNum) !== String(num)) return;

        var allBis = [];

        var versions = product.productVersions || product.product_versions || [];
        versions.forEach(function(version) {
          var bis = version.buildingInstructions || version.building_instructions || [];
          allBis = allBis.concat(bis);
        });

        var directBis = product.buildingInstructions || product.building_instructions || [];
        allBis = allBis.concat(directBis);

        allBis.forEach(function(bi) {
          var url = bi.pdfLocation || (bi.file && bi.file.url) || bi.url || '';
          var isAlt = bi.isAlternative || bi.is_alternative || false;
          if (url && !isAlt) {
            var seq = 1;
            var tot = 1;
            if (bi.sequence) {
              seq = bi.sequence.element || bi.sequence.index || 1;
              tot = bi.sequence.total || bi.sequence.count || 1;
            }
            var desc = bi.description || '';
            var seqMatch = desc.match(/(\d+)\s*\/\s*(\d+)/);
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
          }
        });
      });

      instructions.sort(function(a, b) { return a.sequence - b.sequence; });

      // Remove duplicates by URL
      var seen = {};
      instructions = instructions.filter(function(ins) {
        if (seen[ins.url]) return false;
        seen[ins.url] = true;
        return true;
      });

      if (instructions.length > 0) {
        insCache[num] = instructions;
      }
      return instructions;
    } catch(e) {
      return [];
    }
  })();

  var result = await pendingFetches[num];
  delete pendingFetches[num];
  return result;
}
