import { Howl } from "howler";

// Swap in real ambience/foley files under content/assets/audio once they exist.
class SoundManager {
  private ambience: Howl | null = null;
  private muted = true;

  init(ambienceSrc?: string) {
    if (!ambienceSrc || this.ambience) return;
    this.ambience = new Howl({ src: [ambienceSrc], loop: true, volume: 0 });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ambience) return;
    if (muted) {
      this.ambience.fade(this.ambience.volume(), 0, 400);
    } else {
      if (!this.ambience.playing()) this.ambience.play();
      this.ambience.fade(this.ambience.volume(), 0.4, 800);
    }
  }

  isMuted() {
    return this.muted;
  }

  playFoley(src: string, volume = 0.5) {
    if (this.muted) return;
    new Howl({ src: [src], volume }).play();
  }
}

export const soundManager = new SoundManager();
