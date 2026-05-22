import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const BACK_TO_TOP_VISIBLE_OFFSET = 160;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(getScrollTop() > BACK_TO_TOP_VISIBLE_OFFSET);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  function scrollToTop() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <button
      className="icon-button message-back-to-top-button"
      type="button"
      title="Back to top"
      aria-label="Back to top"
      onClick={scrollToTop}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}

function getScrollTop(): number {
  return window.scrollY || document.scrollingElement?.scrollTop || document.documentElement.scrollTop || 0;
}
