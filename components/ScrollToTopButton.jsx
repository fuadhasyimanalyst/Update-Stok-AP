"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollToTopButton() {
  const [atTop, setAtTop] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setAtTop(scrollY < 200);
      setVisible(maxScroll > 300);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  function handleClick() {
    if (atTop) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      title={atTop ? "Ke bawah" : "Kembali ke atas"}
      aria-label={atTop ? "Gulir ke bawah" : "Gulir ke atas"}
      className="fixed bottom-5 right-5 z-40 flex items-center justify-center h-11 w-11 rounded-full bg-[var(--blue)] text-white shadow-lg hover:bg-[var(--blue-700)] transition-all active:scale-95"
    >
      {atTop ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
    </button>
  );
}
