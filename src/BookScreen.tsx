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
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: scrollContainerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
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
      </div>
    </div>
  );
}
