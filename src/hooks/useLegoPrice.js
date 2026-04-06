import { useState, useEffect } from 'react';
import { getKrwPrice, formatKRW } from '../utils/price';

function useLegoPrice(setNum) {
  var s1 = useState(null); var priceInfo = s1[0]; var setPriceInfo = s1[1];
  var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];

  useEffect(function() {
    if (!setNum) { setLoading(false); return; }
    var result = getKrwPrice(setNum);
    setPriceInfo(result);
    setLoading(false);
  }, [setNum]);

  var formatted = priceInfo && priceInfo.price > 0 ? formatKRW(priceInfo.price) : null;
  var isDiscontinued = priceInfo ? priceInfo.discontinued : false;

  return {
    priceInfo: priceInfo,
    formatted: formatted,
    isDiscontinued: isDiscontinued,
    loading: loading,
  };
}

export default useLegoPrice;
