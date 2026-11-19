"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ui-sound";

type AudioContextCtor = typeof AudioContext;

interface UiSound {
  enabled: boolean;
  toggle: () => void;
  /** Soft, high blip — hovering or switching between items. */
  tick: () => void;
  /** Slightly lower, fuller blip — pressing an item. */
  click: () => void;
}

/**
 * Tiny interface sounds synthesised with Web Audio, so no audio files ship.
 * Off by default; the choice persists in localStorage. Browsers only allow an
 * AudioContext to start after a user gesture, so the first sounds after a
 * reload play once the visitor has clicked or tapped somewhere.
 */
export function useUiSound(): UiSound {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) === "on";
      enabledRef.current = stored;
      setEnabled(stored);
    } catch {
      // Storage blocked (private mode, sandboxed iframe): stay muted.
    }
  }, []);

  useEffect(() => {
    return () => {
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    };
  }, []);

  const audioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!contextRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return null;
      contextRef.current = new Ctor();
    }
    const context = contextRef.current;
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    return context;
  }, []);

  const blip = useCallback(
    (frequency: number, duration: number, volume: number, force = false) => {
      if (!force && !enabledRef.current) return;
      const context = audioContext();
      if (!context || context.state !== "running") return;

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    },
    [audioContext],
  );

  const tick = useCallback(() => blip(1400, 0.035, 0.035), [blip]);
  const click = useCallback(() => blip(700, 0.06, 0.06), [blip]);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Not persisted; the toggle still works for this visit.
    }
    // The toggle click is itself a user gesture, so the context can start here.
    if (next) {
      audioContext();
      window.setTimeout(() => blip(700, 0.06, 0.06, true), 0);
    }
  }, [audioContext, blip]);

  return { enabled, toggle, tick, click };
}
