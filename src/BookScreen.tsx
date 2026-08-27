import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Book } from "./three/Book";
import { chapters } from "./content/chapters";
import { soundManager } from "./audio/SoundManager";

gsap.registerPlugin(ScrollTrigger);

export default function BookScreen() {
  const progressRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: scrollContainerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        // Direct style write instead of React state -- this fires on every
        // scroll tick and a hint that's only visible for an instant at the
        // very start doesn't need a re-render each time.
        if (scrollHintRef.current) {
          scrollHintRef.current.style.opacity = self.progress > 0.015 ? "0" : "1";
        }
      },
    });
    return () => trigger.kill();
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundManager.setMuted(next);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="scroll-container"
      style={{ height: `${chapters.length * 100}vh` }}
    >
      <div className="fixed-stage">
        <Book progressRef={progressRef} />
        <div className="vignette" />
        <button className="mute-toggle" onClick={toggleMute}>
          {muted ? "Ton an" : "Ton aus"}
        </button>
        <div ref={scrollHintRef} className="scroll-hint">
          <span className="scroll-hint-arrow">↓</span>
          <span>scrollen, um zu blättern</span>
        </div>
      </div>
    </div>
  );
}
