import React, { useState, useEffect } from 'react';

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let rafId = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (totalScroll > 0) {
          setScrollProgress((window.scrollY / totalScroll) * 100);
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-50 bg-transparent pointer-events-none">
      <div
        className="h-full bg-[#059669] transition-saas"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
