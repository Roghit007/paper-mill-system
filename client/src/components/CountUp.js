import React, { useEffect, useState } from 'react';

// Animates a number from 0 up to "value"
function CountUp({ value = 0, decimals = 0, duration = 1000, suffix = '' }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <>{text}{suffix && <small>{suffix}</small>}</>;
}

export default CountUp;