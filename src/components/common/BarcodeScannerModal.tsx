'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (scannedValue: string) => void;
  title?: string;
  subtitle?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Barcode / QR IMEI',
  subtitle = 'Arahkan kamera ke barcode pada dus HP atau layar *#06#',
}: BarcodeScannerModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const readerElementId = 'epicphone-barcode-scanner-viewport';

  // Audio & haptic feedback on successful scan
  const triggerSuccessFeedback = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      }
    } catch {
      // AudioContext might be unavailable or blocked
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch {
      // Vibrate not supported or permission denied
    }
  };

  const extractImei = (text: string): string => {
    if (!text) return '';
    // 1. Look for explicit 15 consecutive digits
    const match15 = text.match(/\b\d{15}\b/);
    if (match15) return match15[0];

    // 2. Look for any consecutive 15 digits
    const matchAny15 = text.match(/\d{15}/);
    if (matchAny15) return matchAny15[0];

    // 3. Strip non-digits; if >= 15 digits, take first 15
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length >= 15) {
      return digitsOnly.slice(0, 15);
    }

    // 4. Fallback: digits only or raw text
    return digitsOnly.length > 0 ? digitsOnly : text.trim();
  };

  const handleScanSuccess = (decodedText: string) => {
    const cleanImei = extractImei(decodedText);
    if (!cleanImei) return;

    triggerSuccessFeedback();
    setLastScanned(cleanImei);

    // Give visual confirmation for 300ms before closing
    setTimeout(() => {
      stopScanner().then(() => {
        onDetected(cleanImei);
        onClose();
      });
    }, 350);
  };

  const stopScanner = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    try {
      isStoppingRef.current = true;
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
      setIsScanning(false);
      setIsTorchOn(false);
      setHasTorch(false);
    }
  };

  const startScanner = async (cameraIdOrFacing?: string | MediaTrackConstraints) => {
    await stopScanner();
    setErrorMsg(null);
    setLastScanned(null);

    try {
      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      // Scan config: responsive qrbox area optimized for 1D barcode and 2D QR
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Wide aspect ratio box ideal for horizontal phone box barcodes
          const width = Math.min(viewfinderWidth * 0.85, 320);
          const height = Math.min(viewfinderHeight * 0.45, 180);
          return { width: Math.round(width), height: Math.round(height) };
        },
        aspectRatio: 1.333333,
      };

      const cameraParam = cameraIdOrFacing || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraParam,
        config,
        (decodedText) => handleScanSuccess(decodedText),
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);

      // Check torch capabilities
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }

      // Populate camera list if not already loaded
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id}` })));
        }
      } catch {
        // Ignored if permissions not granted for device enum
      }
    } catch (err: any) {
      console.error('Failed to start barcode scanner:', err);
      let message = 'Gagal mengakses kamera.';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        message = 'Izin kamera ditolak. Mohon izinkan akses kamera di browser Anda.';
      } else if (err?.name === 'NotFoundError' || String(err).includes('not found')) {
        message = 'Kamera tidak ditemukan pada perangkat ini.';
      } else if (err?.name === 'NotReadableError') {
        message = 'Kamera sedang digunakan oleh aplikasi lain.';
      } else if (typeof err === 'string') {
        message = err;
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMsg(message);
      setIsScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    await startScanner(cameras[nextIdx].id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      let tempScanner = scannerRef.current;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode(readerElementId, { verbose: false });
        scannerRef.current = tempScanner;
      } else if (tempScanner.isScanning) {
        await tempScanner.stop();
      }

      const decodedText = await tempScanner.scanFile(file, false);
      handleScanSuccess(decodedText);
    } catch (scanErr: any) {
      setErrorMsg('Barcode tidak terbaca dari foto ini. Pastikan barcode terlihat jelas dan tidak blur.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for modal DOM mount
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* html5-qrcode mounts inside this element */}
          <div id={readerElementId} className="w-full h-full [&_video]:w-full [&_video]:object-cover" />

          {/* Scanner Overlay Box Guide */}
          {isScanning && !lastScanned && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-[85%] max-w-[300px] h-[120px] rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br" />

                {/* Animated scan line */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />

                <div className="absolute -bottom-7 inset-x-0 text-center">
                  <span className="text-[11px] font-medium text-blue-200 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    Posisikan barcode IMEI di dalam kotak ini
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {lastScanned && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-xs text-slate-400 font-medium">IMEI Berhasil Terdeteksi!</p>
              <p className="text-lg font-mono font-bold text-white tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                {lastScanned}
              </p>
            </div>
          )}

          {/* Error / Permissions Prompt */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
                <AlertCircle size={26} />
              </div>
              <h4 className="text-sm font-semibold text-rose-300 mb-1">Akses Kamera Terkendala</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">{errorMsg}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition shadow"
                >
                  <RefreshCw size={13} />
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition border border-slate-700"
                >
                  <Upload size={13} />
                  Pilih Foto Barcode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Flashlight button */}
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!hasTorch || !isScanning}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              hasTorch && isTorchOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none'
            }`}
            title={hasTorch ? 'Nyalakan Lampu' : 'Flashlight tidak didukung perangkat'}
          >
            {isTorchOn ? <Flashlight size={14} /> : <FlashlightOff size={14} />}
            <span className="hidden sm:inline">{isTorchOn ? 'Flash Nyala' : 'Lampu'}</span>
          </button>

          {/* Camera switch button */}
          {cameras.length > 1 && (
            <button
              type="button"
              onClick={switchCamera}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Ganti Kamera"
            >
              <SwitchCamera size={14} />
              <span className="hidden sm:inline">Ganti Kamera</span>
            </button>
          )}

          {/* Upload image alternative */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Scan dari file gambar dus / barcode"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload Foto</span>
          </button>

          {/* Hidden file input for barcode scanning from photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition ml-auto"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
