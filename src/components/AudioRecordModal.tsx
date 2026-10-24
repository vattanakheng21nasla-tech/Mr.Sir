import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DocumentAttachment } from '../types/document';
import { AttachmentStorageService } from '../services/attachmentStorageService';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  AlertCircle
} from 'lucide-react';

interface AudioRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAudio: (attachment: DocumentAttachment) => void;
  defaultTitle?: string;
}

export const AudioRecordModal: React.FC<AudioRecordModalProps> = ({
  isOpen,
  onClose,
  onSaveAudio,
  defaultTitle = 'ចំណារជាសំឡេងផ្លូវការ',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioName, setAudioName] = useState(defaultTitle);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsRecording(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingSeconds(0);
      setErrorMessage(null);
    }
    return () => {
      cleanup();
    };
  }, [isOpen, cleanup]);

  if (!isOpen) return null;

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('ឧបករណ៍ ឬកម្មវិធីរុករកនេះមិនគាំទ្រការថតសំឡេងដោយផ្ទាល់ឡើយ');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'មិនអាចបើកមីក្រូហ្វូនបានឡើយ';
      setErrorMessage(msg);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Play / Pause preview
  const togglePlayAudio = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Save Audio Attachment
  const handleSaveAudio = async () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const fileId = `audio-${Date.now()}`;
      const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      const cleanName = audioName.trim()
        ? audioName.endsWith(`.${ext}`)
          ? audioName
          : `${audioName}.${ext}`
        : `សំឡេង_${Date.now()}.${ext}`;

      // Save to IndexedDB for large audio storage
      await AttachmentStorageService.saveLargeFile(fileId, dataUrl);

      const attachment: DocumentAttachment = {
        id: fileId,
        name: cleanName,
        size: audioBlob.size,
        type: audioBlob.type || 'audio/webm',
        uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        dataUrl,
        blobId: fileId,
        category: 'audio'
      };

      onSaveAudio(attachment);
      onClose();
    };
    reader.readAsDataURL(audioBlob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ថតសំឡេងចំណារ ឬសេចក្តីណែនាំ
              </h3>
              <p className="text-[11px] text-slate-500">
                ថតសំឡេងមតិយោបល់ ឬការណែនាំផ្លូវការរបស់ថ្នាក់ដឹកនាំ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-xs space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Visual Recording Center */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden">
            {/* Animated Wave Bars when recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5 mb-4 h-8">
                <div className="w-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-6" />
                <div className="w-1.5 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s] h-8" />
                <div className="w-1.5 bg-rose-500 rounded-full animate-bounce h-5" />
                <div className="w-1.5 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.2s] h-7" />
                <div className="w-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.4s] h-4" />
              </div>
            )}

            {/* Timer Display */}
            <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
              {formatTime(recordingSeconds)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-rose-600 font-semibold">កំពុងថតសំឡេង...</span>
                </>
              ) : audioUrl ? (
                <span className="text-emerald-700 font-semibold">ថតសំឡេងបានជោគជ័យ</span>
              ) : (
                <span>ចុចប៊ូតុងដើម្បីចាប់ផ្តើមថត</span>
              )}
            </div>

            {/* Main Action Record / Stop Button */}
            <div className="mt-5">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ring-4 ring-rose-200"
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              ) : audioUrl ? (
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-14 h-14 rounded-full bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ring-4 ring-blue-100"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5 fill-white" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ring-4 ring-rose-100"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Audio Name input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ឈ្មោះឯកសារសំឡេង (Audio Memo Title)
            </label>
            <input
              type="text"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="ឧ. ចំណារសំឡេងរបស់អគ្គនាយក..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          {audioUrl ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ថតម្តងទៀត</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={!audioUrl || isRecording}
              onClick={handleSaveAudio}
              className="px-4 py-1.5 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>បញ្ចូលជាឯកសារភ្ជាប់</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
