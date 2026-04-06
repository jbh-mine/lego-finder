import { useState, useEffect } from 'react';
import { fetchInstructions, fetchPdfSize } from '../utils/instructions';

// Format bytes to human-readable size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function useInstructions(setNum) {
  var s1 = useState([]); var instructions = s1[0]; var setInstructions = s1[1];
  var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];
  var s3 = useState(''); var legoProductNumber = s3[0]; var setLegoProductNumber = s3[1];
  var s4 = useState({}); var fileSizes = s4[0]; var setFileSizes = s4[1];

  useEffect(function() {
    if (!setNum) { setInstructions([]); setLoading(false); setLegoProductNumber(''); return; }
    var cancelled = false;
    setLoading(true);
    fetchInstructions(setNum).then(function(result) {
      if (!cancelled) {
        var ins = result.instructions || result;
        setInstructions(ins);
        setLegoProductNumber(result.legoProductNumber || '');
        setLoading(false);

        // Fetch file sizes for instructions that don't have them
        if (ins && ins.length > 0) {
          ins.forEach(function(item, idx) {
            if (item.fileSize && item.fileSize > 0) {
              // Already have size from API
              setFileSizes(function(prev) {
                var o = {}; o[idx] = formatFileSize(item.fileSize);
                return Object.assign({}, prev, o);
              });
            } else {
              // Fetch via HEAD request
              fetchPdfSize(item.url).then(function(size) {
                if (!cancelled && size > 0) {
                  setFileSizes(function(prev) {
                    var o = {}; o[idx] = formatFileSize(size);
                    return Object.assign({}, prev, o);
                  });
                }
              });
            }
          });
        }
      }
    });
    return function() { cancelled = true; };
  }, [setNum]);

  return { instructions: instructions, loading: loading, legoProductNumber: legoProductNumber, fileSizes: fileSizes };
}
