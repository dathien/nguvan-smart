import { useCallback, useEffect, useRef, useState } from 'react';

export interface VietnameseSpeechState {
  supported: boolean;
  hasVietnameseVoice: boolean;
  voiceName: string | null;
  isSpeaking: boolean;
  isPaused: boolean;
  muted: boolean;
  rate: number;
  showCaption: boolean;
  statusMessage: string;
}

/**
 * Vietnamese Web Speech narration hook.
 * Strictly follows Section X:
 * - Uses native device Vietnamese voices (zero paid API).
 * - NEVER falls back to an English voice for Vietnamese text.
 * - Clearly notifies the user and preserves full text narration if no vi-VN voice is installed.
 */
export function useVietnameseSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [showCaption, setShowCaption] = useState(true);
  const lastTextRef = useRef<string>('');

  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const vietnameseVoice =
    voices.find((v) => v.lang.toLowerCase() === 'vi-vn') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('vi')) ||
    voices.find((v) => v.name.toLowerCase().includes('vietnam')) ||
    null;

  const hasVietnameseVoice = Boolean(vietnameseVoice);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      lastTextRef.current = text;
      if (!supported || muted || !vietnameseVoice || !text.trim()) {
        return false;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = vietnameseVoice;
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [supported, muted, vietnameseVoice, rate]
  );

  const pause = useCallback(() => {
    if (!supported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported, isSpeaking]);

  const resume = useCallback(() => {
    if (!supported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [supported, isPaused]);

  const replay = useCallback(() => {
    if (lastTextRef.current) {
      speak(lastTextRef.current);
    }
  }, [speak]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next && supported) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return next;
    });
  }, [supported]);

  const statusMessage = !supported
    ? 'Trình duyệt hiện tại không hỗ trợ đọc giọng nói trực tiếp. Lời dẫn đầy đủ vẫn hiển thị bằng văn bản.'
    : !hasVietnameseVoice
    ? 'Thiết bị chưa cài gói giọng đọc tiếng Việt (vi-VN). Hệ thống không dùng giọng tiếng Anh thay thế và vẫn hiển thị trọn vẹn lời dẫn bằng văn bản.'
    : muted
    ? 'Đã tắt âm thanh lời dẫn.'
    : `Giọng đọc tiếng Việt sẵn sàng (${vietnameseVoice?.name}).`;

  return {
    state: {
      supported,
      hasVietnameseVoice,
      voiceName: vietnameseVoice?.name || null,
      isSpeaking,
      isPaused,
      muted,
      rate,
      showCaption,
      statusMessage,
    } as VietnameseSpeechState,
    speak,
    pause,
    resume,
    stop,
    replay,
    toggleMute,
    setRate,
    setShowCaption,
  };
}
