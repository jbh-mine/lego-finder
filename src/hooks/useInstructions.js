import { useState, useEffect } from 'react';
import { fetchInstructions } from '../utils/instructions';

export default function useInstructions(setNum) {
  var s1 = useState([]); var instructions = s1[0]; var setInstructions = s1[1];
  var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];
  var s3 = useState(''); var legoProductNumber = s3[0]; var setLegoProductNumber = s3[1];

  useEffect(function() {
    if (!setNum) { setInstructions([]); setLoading(false); setLegoProductNumber(''); return; }
    var cancelled = false;
    setLoading(true);
    fetchInstructions(setNum).then(function(result) {
      if (!cancelled) {
        setInstructions(result.instructions || result);
        setLegoProductNumber(result.legoProductNumber || '');
        setLoading(false);
      }
    });
    return function() { cancelled = true; };
  }, [setNum]);

  return { instructions: instructions, loading: loading, legoProductNumber: legoProductNumber };
}
