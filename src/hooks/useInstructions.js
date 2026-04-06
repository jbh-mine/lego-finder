import { useState, useEffect } from 'react';
import { fetchInstructions } from '../utils/instructions';

export default function useInstructions(setNum) {
  var s1 = useState([]); var instructions = s1[0]; var setInstructions = s1[1];
  var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];

  useEffect(function() {
    if (!setNum) { setInstructions([]); setLoading(false); return; }
    var cancelled = false;
    setLoading(true);
    fetchInstructions(setNum).then(function(result) {
      if (!cancelled) {
        setInstructions(result);
        setLoading(false);
      }
    });
    return function() { cancelled = true; };
  }, [setNum]);

  return { instructions: instructions, loading: loading };
}
