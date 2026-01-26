// Short "Pop" / "Click" sound effect
const clickAudio = new Audio("data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."); 

// We use a simple high-pitch short blip for UI feedback
const CLICK_SOUND_B64 = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAf39/f39/f39/gIA=";

// Create audio object once
let audio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
  audio = new Audio(CLICK_SOUND_B64);
  audio.volume = 0.5;
}

export const triggerHaptic = () => {
  // 1. Vibrate (Mobile only)
  // 10-15ms is a standard "light" tap feeling for UI elements
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15);
  }

  // 2. Sound
  if (audio) {
    try {
      audio.currentTime = 0; // Reset to start
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented, or user hasn't interacted with document yet
          // Silently fail is fine for UI sounds
        });
      }
    } catch (e) {
      // Ignore audio errors
    }
  }
};
