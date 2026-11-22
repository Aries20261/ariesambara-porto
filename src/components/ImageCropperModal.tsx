import React, { useEffect, useRef, useState } from 'react';
import { Check, Image as ImageIcon, RotateCcw, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (webpDataUrl: string, meta: { width: number; height: number; sizeKb: number }) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB PRD Limit
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const OUTPUT_SIZE = 800; // Minimum 800x800 px retina spec per PRD

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, onApply }) => {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [originalFileMeta, setOriginalFileMeta] = useState<{ name: string; sizeKb: number; width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [quality, setQuality] = useState<number>(0.88);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [previewMeta, setPreviewMeta] = useState<{ sizeKb: number; dataUrl: string } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format berkas tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal 5 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setOriginalFileMeta({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      img.onerror = () => {
        setError('Gagal membaca gambar. Pastikan berkas tidak rusak.');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Render preview & compute WebP output size
  useEffect(() => {
    if (!imageObj || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#0A0C0E';
    ctx.fillRect(0, 0, size, size);

    // Base scale so image covers 1:1 square
    const baseScale = Math.max(size / imageObj.naturalWidth, size / imageObj.naturalHeight);
    const activeScale = baseScale * zoom;

    const drawW = imageObj.naturalWidth * activeScale;
    const drawH = imageObj.naturalHeight * activeScale;

    // Clamp offset so image always covers square
    const maxOffsetX = Math.max(0, (drawW - size) / 2);
    const maxOffsetY = Math.max(0, (drawH - size) / 2);
    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y));

    const drawX = (size - drawW) / 2 + clampedX;
    const drawY = (size - drawH) / 2 + clampedY;

    ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);

    // Also render 800x800 WebP estimate
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = OUTPUT_SIZE;
    exportCanvas.height = OUTPUT_SIZE;
    const exCtx = exportCanvas.getContext('2d');
    if (exCtx) {
      const ratioFactor = OUTPUT_SIZE / size;
      exCtx.fillStyle = '#0A0C0E';
      exCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      exCtx.drawImage(
        imageObj,
        drawX * ratioFactor,
        drawY * ratioFactor,
        drawW * ratioFactor,
        drawH * ratioFactor
      );
      const webpUrl = exportCanvas.toDataURL('image/webp', quality);
      const base64Length = webpUrl.split(',')[1]?.length ?? 0;
      const estimatedBytes = Math.ceil((base64Length * 3) / 4);
      setPreviewMeta({
        dataUrl: webpUrl,
        sizeKb: Math.max(1, Math.round(estimatedBytes / 1024)),
      });
    }
  }, [imageObj, zoom, offset, quality]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageObj) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imageObj) return;
    const size = 320;
    const baseScale = Math.max(size / imageObj.naturalWidth, size / imageObj.naturalHeight);
    const activeScale = baseScale * zoom;
    const drawW = imageObj.naturalWidth * activeScale;
    const drawH = imageObj.naturalHeight * activeScale;
    const maxOffsetX = Math.max(0, (drawW - size) / 2);
    const maxOffsetY = Math.max(0, (drawH - size) / 2);

    const nextX = Math.max(-maxOffsetX, Math.min(maxOffsetX, e.clientX - dragStart.x));
    const nextY = Math.max(-maxOffsetY, Math.min(maxOffsetY, e.clientY - dragStart.y));
    setOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#111418] border border-[rgba(212,175,55,0.3)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[rgba(212,175,55,0.2)] flex items-center justify-between">
          <div>
            <h3 id="cropper-modal-title" className="font-display text-lg font-bold text-[#F3E5AB]">
              1:1 Image Cropper & WebP Optimizer
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Auto-crop persegi 1:1 dan kompresi ke WebP ({OUTPUT_SIZE} × {OUTPUT_SIZE} px) · Maks 5 MB
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup cropper"
            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Cropper Canvas Frame */}
            <div className="flex flex-col items-center">
              <div className="relative w-[320px] max-w-full aspect-square rounded-xl p-[2px] bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#8C6C15]">
                <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#0A0C0E] relative flex items-center justify-center">
                  {imageObj ? (
                    <canvas
                      ref={previewCanvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6 hover:bg-[#181C22]/60 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl border border-[#D4AF37]/40 bg-[#181C22] flex items-center justify-center text-[#D4AF37]">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#F3E5AB] block">
                          Pilih Foto Profil (1:1)
                        </span>
                        <span className="text-xs text-neutral-400 mt-1 block">
                          JPG, PNG, atau WebP · Maksimal 5 MB
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Subtle rule-of-thirds overlay when image loaded */}
                  {imageObj && (
                    <div className="pointer-events-none absolute inset-0 border border-[#D4AF37]/20">
                      <div className="absolute inset-y-0 left-1/3 w-px bg-[#D4AF37]/15" />
                      <div className="absolute inset-y-0 left-2/3 w-px bg-[#D4AF37]/15" />
                      <div className="absolute inset-x-0 top-1/3 h-px bg-[#D4AF37]/15" />
                      <div className="absolute inset-x-0 top-2/3 h-px bg-[#D4AF37]/15" />
                    </div>
                  )}
                </div>
              </div>
              {imageObj && (
                <span className="mt-2 text-[11px] text-neutral-400">
                  Seret foto untuk memusatkan komposisi wajah
                </span>
              )}
            </div>

            {/* Controls & Optimization Metrics */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-lg border border-[rgba(212,175,55,0.35)] bg-[#181C22] text-sm font-medium text-[#F3E5AB] hover:border-[#D4AF37] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                {imageObj ? 'Pilih Gambar Lain' : 'Unggah Berkas Gambar'}
              </button>

              <div className="p-4 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.2)] space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-neutral-300 font-medium">Pembesaran (Zoom)</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums">{zoom.toFixed(2)}×</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ZoomOut className="w-4 h-4 text-neutral-500 shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      disabled={!imageObj}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] cursor-pointer disabled:opacity-40"
                    />
                    <ZoomIn className="w-4 h-4 text-neutral-500 shrink-0" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-neutral-300 font-medium">Kualitas Kompresi WebP</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.65}
                    max={0.96}
                    step={0.01}
                    value={quality}
                    disabled={!imageObj}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-[#D4AF37] cursor-pointer disabled:opacity-40"
                  />
                </div>

                {imageObj && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="text-xs text-neutral-400 hover:text-[#F3E5AB] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pusatkan Ulang Posisi
                  </button>
                )}
              </div>

              {/* Spec readout */}
              <div className="p-3.5 rounded-lg bg-[#181C22]/70 border border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Resolusi Output</span>
                  <span className="font-mono text-neutral-200 tabular-nums">
                    {OUTPUT_SIZE} × {OUTPUT_SIZE} px (1:1)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Format Target</span>
                  <span className="font-mono text-[#D4AF37]">image/webp</span>
                </div>
                {originalFileMeta && previewMeta && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ukuran Berkas</span>
                    <span className="font-mono text-neutral-200 tabular-nums">
                      {originalFileMeta.sizeKb} KB → <strong className="text-[#F3E5AB]">{previewMeta.sizeKb} KB</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(212,175,55,0.2)] bg-[#0A0C0E]/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!previewMeta}
            onClick={() => {
              if (previewMeta) {
                onApply(previewMeta.dataUrl, {
                  width: OUTPUT_SIZE,
                  height: OUTPUT_SIZE,
                  sizeKb: previewMeta.sizeKb,
                });
                onClose();
              }
            }}
            className="py-2 px-5 rounded-lg gold-action-btn text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Terapkan Foto 1:1
          </button>
        </div>
      </div>
    </div>
  );
};
