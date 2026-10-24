import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DocumentAttachment } from '../types/document';
import { AttachmentStorageService } from '../services/attachmentStorageService';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  RotateCcw,
  Upload,
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (attachment: DocumentAttachment) => void;
  documentTitle?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  documentTitle = 'ឯកសាររដ្ឋបាល',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [saveFormat, setSaveFormat] = useState<'png' | 'pdf'>('png');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackFileRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);
    setCapturedDataUrl(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('ឧបករណ៍ ឬកម្មវិធីរុករកនេះមិនគាំទ្រការបើកកាមេរ៉ាផ្ទាល់ឡើយ');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'មិនអាចបើកកាមេរ៉ាបានទេ';
      setCameraError(msg);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedDataUrl(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  if (!isOpen) return null;

  // Take Snapshot from video
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCapturedDataUrl(dataUrl);
    stopStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  // Flip camera between front/back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Fallback upload if camera permission denied
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedDataUrl(dataUrl);
      stopStream();
    };
    reader.readAsDataURL(file);
  };

  // Save and attach
  const handleConfirmSave = async () => {
    if (!capturedDataUrl) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const fileId = `photo-${Date.now()}`;
    const ext = saveFormat === 'pdf' ? 'pdf' : 'png';
    const mime = saveFormat === 'pdf' ? 'application/pdf' : 'image/png';
    const fileName = `ថតឯកសារ_${timestamp}.${ext}`;

    // Store in IndexedDB for large storage
    await AttachmentStorageService.saveLargeFile(fileId, capturedDataUrl);

    // Approximate size from base64
    const approxBytes = Math.round((capturedDataUrl.length * 3) / 4);

    const attachment: DocumentAttachment = {
      id: fileId,
      name: fileName,
      size: approxBytes,
      type: mime,
      uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      dataUrl: capturedDataUrl,
      blobId: fileId,
      category: 'photo'
    };

    onCapture(attachment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ថតរូបឯកសាររដ្ឋបាល (Live Document Camera Scanner)
              </h3>
              <p className="text-[11px] text-slate-500">
                ថតរូបស្កេនលិខិត ឬលិខិតយោង រួចរក្សាទុកជា PNG ឬ PDF ទំហំច្បាស់កម្រិតខ្ពស់
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

        {/* Viewfinder / Preview Body */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[360px] relative">
          {cameraError ? (
            <div className="text-center p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 max-w-md space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="font-semibold text-white text-xs">
                មិនអាចដំណើរការកាមេរ៉ាដោយផ្ទាល់បានទេ
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {cameraError}. សូមពិនិត្យសិទ្ធិកាមេរ៉ាក្នុង Browser ឬប្រើប៊ូតុងខាងក្រោមដើម្បីជ្រើសរើសរូបភាពពីឧបករណ៍របស់អ្នក។
              </p>
              <button
                onClick={() => fallbackFileRef.current?.click()}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>ជ្រើសរើសរូបភាពពីឧបករណ៍</span>
              </button>
              <input
                ref={fallbackFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFile}
                className="hidden"
              />
            </div>
          ) : capturedDataUrl ? (
            <div className="relative w-full max-h-[420px] flex items-center justify-center overflow-hidden rounded-lg bg-black">
              <img
                src={capturedDataUrl}
                alt="Captured document"
                className="max-h-[420px] w-auto object-contain rounded-lg"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                រូបភាពត្រូវបានថតជោគជ័យ
              </div>
            </div>
          ) : (
            <div className="relative w-full max-h-[420px] flex items-center justify-center overflow-hidden rounded-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[420px] object-cover rounded-lg"
              />
              {/* Document Alignment Overlay Box */}
              <div className="absolute inset-6 border-2 border-dashed border-white/60 pointer-events-none rounded-lg flex flex-col justify-between p-3">
                <span className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded self-start font-mono">
                  តម្រឹមគែមឯកសារក្នុងប្រអប់នេះ
                </span>
                <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded self-center">
                  កាន់ទូរស័ព្ទ ឬកាមេរ៉ាឱ្យស្ងប់
                </span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {capturedDataUrl ? (
            <>
              {/* Format selection */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold text-[11px]">រក្សាទុកជាទម្រង់៖</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-200 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setSaveFormat('png')}
                    className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                      saveFormat === 'png'
                        ? 'bg-white text-blue-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3 inline mr-1" />
                    PNG Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveFormat('pdf')}
                    className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                      saveFormat === 'pdf'
                        ? 'bg-white text-blue-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3 h-3 inline mr-1" />
                    PDF Document
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ថតម្តងទៀត</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-4 py-1.5 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>បញ្ចូលជាឯកសារភ្ជាប់</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ប្តូរកាមេរ៉ា ({facingMode === 'environment' ? 'ខាងក្រោយ' : 'ខាងមុខ'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => fallbackFileRef.current?.click()}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  ជ្រើសរើស File
                </button>
                <input
                  ref={fallbackFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFallbackFile}
                  className="hidden"
                />
              </div>

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
                  disabled={!stream}
                  onClick={handleSnap}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-40"
                >
                  <Camera className="w-4 h-4" />
                  <span>ចុចថតរូប (Snap Photo)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
