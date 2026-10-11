import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ShieldAlert, Radio } from 'lucide-react';

interface BiometricWebcamMirrorProps {
  chaos: number;
  stage: number;
}

/**
 * Biometric Surveillance Mirror Component
 * Captures user webcam (with permission) and renders it through a real-time
 * Bayer-dithered amber phosphor CRT monitor. Zero data is stored or transmitted.
 */
export const BiometricWebcamMirror: React.FC<BiometricWebcamMirrorProps> = ({ chaos, stage }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Auto-prompt subtly at Stage >= 3 or manual user trigger
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      setStream(media);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      setErrorMsg('OPTICAL SENSOR DENIED / UNAVAILABLE');
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // Real-time canvas CRT raster dither
  useEffect(() => {
    if (!isActive) return;
    let animId: number;

    const renderDither = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // 4x4 Bayer threshold matrix
          const bayer4 = [
            [ 0,  8,  2, 10],
            [12,  4, 14,  6],
            [ 3, 11,  1,  9],
            [15,  7, 13,  5]
          ];

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // Luminance
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const threshold = (bayer4[y % 4][x % 4] / 16) * 255;

              if (gray > threshold) {
                // Phosphor Amber (#F59E0B)
                data[idx] = 245;
                data[idx + 1] = 158;
                data[idx + 2] = 11;
                data[idx + 3] = 240;
              } else {
                // Deep matte graphite black (#121212)
                data[idx] = 18;
                data[idx + 1] = 18;
                data[idx + 2] = 18;
                data[idx + 3] = 255;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }
      animId = requestAnimationFrame(renderDither);
    };

    animId = requestAnimationFrame(renderDither);
    return () => cancelAnimationFrame(animId);
  }, [isActive]);

  return (
    <div className="relative border border-[#3a3a3a] bg-[#181818] p-3 text-left shadow-[5px_5px_0_#0a0a0a]">
      <div className="flex items-center justify-between border-b border-dashed border-[#3a3a3a] pb-2 mb-2 font-mono text-xs">
        <span className="flex items-center gap-1.5 text-[#F59E0B]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          BIOMETRIC OPTICAL FEED // CH.01
        </span>
        <span className="text-[#8d8d8d]">
          {isActive ? 'STREAM ACTIVE' : 'STANDBY'}
        </span>
      </div>

      <div className="relative aspect-video w-full bg-[#101010] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
        <video ref={videoRef} playsInline muted className="hidden" />

        {isActive ? (
          <>
            <canvas
              ref={canvasRef}
              width={160}
              height={120}
              className="w-full h-full object-cover [image-rendering:pixelated]"
            />
            {/* Scanlines & telemetry HUD */}
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.6)_3px)]" />
            <div className="absolute bottom-1.5 left-2 font-mono text-[10px] text-[#F59E0B] tracking-wider">
              FACIAL RECOG: POSITIVE // BLINK INTERVAL: 3.2s
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Camera className="w-6 h-6 text-[#8d8d8d]" />
            <p className="font-mono text-[11px] text-[#8d8d8d]">
              {errorMsg || 'Optical Presence Sensor Offline'}
            </p>
            <button
              onClick={startCamera}
              className="mt-1 px-3 py-1 bg-[#202020] hover:bg-[#F59E0B] hover:text-[#121212] border border-[#3a3a3a] text-xs font-mono text-[#F3F4F6] transition-colors"
            >
              Verify Presence (Webcam)
            </button>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#8d8d8d]">
          <span>RESOLUTION: 160x120 DITHERED</span>
          <button
            onClick={stopCamera}
            className="hover:text-[#F59E0B] flex items-center gap-1"
          >
            <CameraOff className="w-3 h-3" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
