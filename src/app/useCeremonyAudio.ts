import { useCallback, useEffect, useRef, useState } from "react";

export type CeremonyCue = "enter" | "seal" | "draw" | "play" | "reveal";

interface CeremonyAudioController {
  muted: boolean;
  play(cue: CeremonyCue): void;
  toggleMuted(): void;
}

interface CueNote {
  frequency: number;
  gain: number;
  length: number;
  offset: number;
  type: OscillatorType;
}

const MUTE_KEY = "midnight-masquerade.sound-muted";
const cues: Record<CeremonyCue, readonly CueNote[]> = {
  enter: [
    { frequency: 392, gain: 0.035, length: 0.14, offset: 0, type: "sine" },
    { frequency: 587.33, gain: 0.04, length: 0.28, offset: 0.1, type: "sine" },
  ],
  seal: [
    { frequency: 196, gain: 0.04, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 293.66, gain: 0.03, length: 0.15, offset: 0.045, type: "sine" },
  ],
  draw: [
    { frequency: 523.25, gain: 0.026, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 659.25, gain: 0.028, length: 0.1, offset: 0.07, type: "triangle" },
  ],
  play: [
    { frequency: 220, gain: 0.045, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 440, gain: 0.024, length: 0.13, offset: 0.04, type: "sine" },
  ],
  reveal: [
    { frequency: 329.63, gain: 0.025, length: 0.16, offset: 0, type: "sine" },
    { frequency: 493.88, gain: 0.03, length: 0.24, offset: 0.11, type: "sine" },
  ],
};

/**
 * Loads a stored mute preference without requiring an audio context at startup.
 */
function initialMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "true";
}

/**
 * Creates audio only after an interaction and remains inert in unsupported runtimes.
 */
function createAudioContext(): AudioContext | null {
  const webkitWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor =
    window.AudioContext ?? webkitWindow.webkitAudioContext;

  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

/**
 * Provides restrained procedural cues and a persisted mute preference.
 */
export function useCeremonyAudio(): CeremonyAudioController {
  const [muted, setMuted] = useState(initialMuted);
  const context = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );

  /**
   * Schedules one short cue after a player gesture has unlocked browser audio.
   */
  const play = useCallback(
    (cue: CeremonyCue): void => {
      if (muted) {
        return;
      }

      const audio = context.current ?? createAudioContext();

      if (!audio) {
        return;
      }

      context.current = audio;
      void audio.resume();
      const start = audio.currentTime + 0.004;

      cues[cue].forEach((note) => {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        const noteStart = start + note.offset;
        const noteEnd = noteStart + note.length;

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.frequency, noteStart);
        volume.gain.setValueAtTime(0.0001, noteStart);
        volume.gain.exponentialRampToValueAtTime(note.gain, noteStart + 0.014);
        volume.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(volume);
        volume.connect(audio.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd + 0.02);
      });
    },
    [muted],
  );

  /**
   * Stores the listener's preference for every later handoff screen.
   */
  const toggleMuted = (): void => {
    const next = !muted;

    localStorage.setItem(MUTE_KEY, String(next));
    setMuted(next);
  };

  return { muted, play, toggleMuted };
}
