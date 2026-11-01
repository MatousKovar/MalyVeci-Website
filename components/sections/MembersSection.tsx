"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { members } from "@/lib/data";
import MemberCard from "../ui/MemberCard";
import styles from "./MembersSection.module.css";

export default function MembersSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackId = useId();
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateControls() {
      if (!track) return;
      const previous = track.scrollLeft > 2;
      const next = track.scrollLeft < track.scrollWidth - track.clientWidth - 2;
      setCanScroll((current) => current.previous === previous && current.next === next
        ? current
        : { previous, next });
    }

    const image = track.querySelector("img");
    function updateLayout() {
      updateControls();
      const container = track?.parentElement;
      if (!container || !image) return;
      const imageBounds = image.getBoundingClientRect();
      const imageCenter = imageBounds.top - container.getBoundingClientRect().top + imageBounds.height / 2;
      container.style.setProperty("--member-image-center", `${imageCenter}px`);
    }

    updateLayout();
    track.addEventListener("scroll", updateControls, { passive: true });
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(track);
    if (image) resizeObserver.observe(image);

    return () => {
      track.removeEventListener("scroll", updateControls);
      resizeObserver.disconnect();
    };
  }, []);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <div className={styles.members}>
      <div
        id={trackId}
        ref={trackRef}
        role="region"
        aria-label="Členové kapely"
        tabIndex={0}
        className={styles.track}
      >
        {members.map((member) => (
          <MemberCard key={member.name} {...member} />
        ))}
      </div>
      <div role="group" aria-label="Posun členů" className={styles.controls}>
        <button
          type="button"
          aria-label="Předchozí člen"
          aria-controls={trackId}
          disabled={!canScroll.previous}
          onClick={() => scroll(-1)}
          className={styles.arrow}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Další člen"
          aria-controls={trackId}
          disabled={!canScroll.next}
          onClick={() => scroll(1)}
          className={styles.arrow}
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
