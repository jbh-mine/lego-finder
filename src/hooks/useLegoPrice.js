import { useState, useEffect } from 'react';
import { getKrwPriceAsync, formatKRW } from '../utils/price';

function useLegoPrice(setNum) {
  var s1 = useState(null); var priceInfo = s1[0]; var setPriceInfo = s1[1];
  var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];

  useEffect(function() {
    if (!setNum) { setLoading(false); return; }
    var cancelled = false;
    setLoading(true);
    getKrwPriceAsync(setNum).then(function(result) {
      if (!cancelled) {
        setPriceInfo(result);
        setLoading(false);
      }
    }).catch(function() {
      if (!cancelled) {
        setPriceInfo(null);
        setLoading(false);
      }
    });
    return function() { cancelled = true; };
  }, [setNum]);

  var formatted = priceInfo && priceInfo.price > 0 ? formatKRW(priceInfo.price) : null;
  var isDiscontinued = priceInfo ? priceInfo.discontinued : false;
  var fromUsd = priceInfo ? priceInfo.fromUsd : null;

  return {
    priceInfo: priceInfo,
    formatted: formatted,
    isDiscontinued: isDiscontinued,
    fromUsd: fromUsd,
    loading: loading,
  };
}

export default useLegoPrice;
