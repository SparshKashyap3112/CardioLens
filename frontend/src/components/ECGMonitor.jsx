import React, { useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Info,
  Radio,
  Clock
} from 'lucide-react';
import './ECGMonitor.css';

/**
 * ECG-Style Signal Monitor Visualizer Component
 * 
 * Clinical Accuracy Notice:
 * This component renders an illustrative medical telemetry waveform for visual feedback
 * during audio ingestion and CNN inference. CardioLens analyzes phonocardiogram (PCG)
 * acoustic heart recordings, not electrocardiogram (ECG) electrical potentials.
 * This visualization is non-diagnostic and must not be presented as patient ECG data.
 * 
 * Props:
 * @param {'idle' | 'uploading' | 'processing' | 'complete' | 'error'} status - Real analysis lifecycle state
 * @param {number} [uploadProgress=0] - Actual upload percentage (0-100) if available
 * @param {string} [errorMessage] - Concise error description when status === 'error'
 * @param {function} [onRetry] - Callback to retry analysis on failure
 * @param {string} [className] - Optional custom container CSS classes
 */
export default function ECGMonitor({
  status = 'idle',
  uploadProgress = 0,
  errorMessage = null,
  onRetry = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const lastTimeRef = useRef(null);

  // Status text & badge configuration matching requirements
  const statusConfig = {
    idle: {
      label: 'Ready for analysis',
      footerCode: 'STANDBY',
      badgeClass: 'status-idle',
      codeClass: 'code-idle',
      icon: Activity,
      telemetryLead: 'STANDBY',
      isLive: false,
    },
    uploading: {
      label: 'Uploading recording...',
      footerCode: 'UPLOADING AUDIO',
      badgeClass: 'status-uploading',
      codeClass: 'code-uploading',
      icon: Clock,
      telemetryLead: 'INGEST',
      isLive: true,
    },
    processing: {
      label: 'Analyzing heart sound...',
      footerCode: 'ANALYSIS IN PROGRESS',
      badgeClass: 'status-processing',
      codeClass: 'code-processing',
      icon: Activity,
      telemetryLead: 'LIVE INFERENCE',
      isLive: true,
    },
    complete: {
      label: 'Analysis complete',
      footerCode: 'PROCESSING COMPLETE',
      badgeClass: 'status-complete',
      codeClass: 'code-complete',
      icon: CheckCircle2,
      telemetryLead: 'COMPLETED',
      isLive: false,
    },
    error: {
      label: 'Analysis could not be completed',
      footerCode: 'ANALYSIS ERROR',
      badgeClass: 'status-error',
      codeClass: 'code-error',
      icon: AlertCircle,
      telemetryLead: 'ALERT',
      isLive: false,
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.idle;
  const StatusIcon = currentConfig.icon;

  // Synthesize an illustrative P-Q-R-S-T wave cycle
  // Returns normalized deflection in range [-0.4, 1.0] for phase in [0, 1)
  const getEcgPoint = (phase) => {
    const p = phase % 1;
    if (p < 0.08) return 0;
    // P-wave (smooth rounded atrium depolarization)
    if (p >= 0.08 && p < 0.20) {
      const t = (p - 0.08) / 0.12;
      return Math.sin(t * Math.PI) * 0.14;
    }
    // PR interval baseline
    if (p < 0.25) return 0;
    // Q-wave (sharp downward deflection)
    if (p >= 0.25 && p < 0.28) {
      const t = (p - 0.25) / 0.03;
      return -Math.sin(t * Math.PI) * 0.18;
    }
    // R-peak (tall sharp upward spike to 1.0) & drop
    if (p >= 0.28 && p < 0.34) {
      const t = (p - 0.28) / 0.06;
      if (t < 0.5) {
        return (t / 0.5) * 1.0;
      } else {
        return 1.0 - ((t - 0.5) / 0.5) * 1.38; // drops below baseline into S
      }
    }
    // S-wave return to baseline
    if (p >= 0.34 && p < 0.39) {
      const t = (p - 0.34) / 0.05;
      return -0.38 * (1 - t);
    }
    // ST segment
    if (p < 0.44) return 0.02;
    // T-wave (asymmetric ventricle repolarization)
    if (p >= 0.44 && p < 0.62) {
      const t = (p - 0.44) / 0.18;
      return Math.sin(t * Math.PI) * 0.26;
    }
    // TP baseline return with micro-variations
    return 0;
  };

  // Canvas drawing and animation lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check accessibility: user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle high DPI displays (Retina)
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (displayWidth === 0 || displayHeight === 0) return;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      drawFrame();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Draw the medical monitor grid
    const drawGrid = (width, height) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)'; // minor grid
      ctx.lineWidth = 1;

      const minorStep = 12;
      ctx.beginPath();
      for (let x = 0; x <= width; x += minorStep) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += minorStep) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      // Major grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      const majorStep = minorStep * 4;
      ctx.beginPath();
      for (let x = 0; x <= width; x += majorStep) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += majorStep) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Draw frame for current state
    const drawFrame = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      // Clear dark background
      ctx.fillStyle = '#0B0F17';
      ctx.fillRect(0, 0, width, height);

      // Render subtle grid
      drawGrid(width, height);

      const baselineY = height * 0.55;
      const amplitude = height * 0.36;

      ctx.save();

      if (status === 'error') {
        // Red / Amber flatline for error
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (status === 'idle') {
        // Calm, mostly static baseline with gentle micro-fluctuations (vital standby)
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 1.75;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.45)';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const microNoise = Math.sin(x * 0.05) * 1.2;
          const y = baselineY + microNoise;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (status === 'complete') {
        // Calm completed static waveform
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 8;

        const cycleLength = 220; // pixels per heartbeat cycle
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const phase = (x % cycleLength) / cycleLength;
          const sample = getEcgPoint(phase);
          const y = baselineY - (sample * amplitude);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Reduced motion fallback for active states
      if (prefersReducedMotion) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 8;

        const cycleLength = 200;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const phase = (x % cycleLength) / cycleLength;
          const sample = getEcgPoint(phase);
          const y = baselineY - (sample * amplitude);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }

      // =========================================================================
      // ACTIVE ANIMATION (processing or uploading)
      // Waveform scrolls continuously from right to left
      // =========================================================================
      const cycleLength = 190; // width of one heartbeat complex in pixels
      const offset = scrollOffsetRef.current;

      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      let lastPointY = baselineY;

      for (let x = 0; x <= width; x += 2) {
        // Right-to-left scrolling: shift by offset
        const virtualX = (x + offset);
        const phase = ((virtualX % cycleLength) + cycleLength) % cycleLength / cycleLength;
        
        let sample = 0;
        if (status === 'uploading') {
          // Subtle pulse wave during audio upload
          sample = getEcgPoint(phase) * 0.45;
        } else {
          // Full luminous cardiac trace during CNN inference
          sample = getEcgPoint(phase);
        }

        const y = baselineY - (sample * amplitude);
        lastPointY = y;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Glowing leading edge indicator at the rightmost scanning margin
      ctx.save();
      ctx.fillStyle = '#6EE7B7';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(width - 4, lastPointY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    // Animation Loop
    let isCancelled = false;

    const animate = (timestamp) => {
      if (isCancelled) return;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Scroll speed: ~150 pixels per second
      const speed = status === 'uploading' ? 90 : 160;
      scrollOffsetRef.current += speed * delta;

      drawFrame();

      // Continue animation only if active and motion is allowed
      if ((status === 'processing' || status === 'uploading') && !prefersReducedMotion) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    if ((status === 'processing' || status === 'uploading') && !prefersReducedMotion) {
      lastTimeRef.current = null;
      animFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      drawFrame();
    }

    // Cleanup on unmount or status change
    return () => {
      isCancelled = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [status]);

  return (
    <section 
      ref={containerRef}
      className={`ecg-monitor-panel ${className}`}
      role="region"
      aria-label="CardioLens ECG-Style Signal Monitor"
    >
      {/* Header Bar */}
      <div className="ecg-monitor-header">
        <div className="ecg-brand-badge">
          <div className="ecg-icon-wrapper" aria-hidden="true">
            <Activity className="w-4 h-4 text-[#E85B3F]" />
          </div>
          <div>
            <h2 className="ecg-monitor-title">CardioLens Signal Monitor</h2>
            <p className="ecg-monitor-subtitle">Acoustic Screening Telemetry</p>
          </div>
        </div>

        {/* Status Pill Badge with Accessible Announcement */}
        <div 
          className={`ecg-status-pill ${currentConfig.badgeClass}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="ecg-status-dot" aria-hidden="true" />
          <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{currentConfig.label}</span>
        </div>
      </div>

      {/* Medical Monitor Display (Charcoal Screen + Soft Luminous Green Trace) */}
      <div className="ecg-screen-wrapper">
        {/* Medical Telemetry Overlays */}
        <div className="ecg-screen-telemetry" aria-hidden="true">
          <div className="telemetry-tag">
            <Radio className="w-3 h-3 text-[#10B981]" />
            <span>CHANNEL: PCG-1</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline opacity-70">SWEEP: 25mm/s</span>
            <span className="hidden sm:inline opacity-70">GAIN: 10mm/mV</span>
            <span className={`telemetry-tag ${currentConfig.isLive ? 'telemetry-state-live' : ''}`}>
              {currentConfig.telemetryLead}
            </span>
          </div>
        </div>

        {/* Waveform Canvas */}
        <canvas 
          ref={canvasRef} 
          className="ecg-canvas"
          role="img"
          aria-label={`Illustrative heart monitor waveform showing status: ${currentConfig.label}`}
        />

        {/* Real Upload Progress Bar along bottom of screen */}
        {status === 'uploading' && uploadProgress > 0 && (
          <div className="ecg-screen-progress">
            <div 
              className="ecg-screen-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Monitor Footer */}
      <div className="ecg-monitor-footer">
        <div className="ecg-footer-meta">
          <div className="ecg-state-desc">
            <span className="text-slate-400 text-xs">Telemetry Mode:</span>
            <span className={`ecg-state-code ${currentConfig.codeClass}`}>
              {currentConfig.footerCode}
            </span>
            {status === 'uploading' && uploadProgress > 0 && (
              <span className="text-xs font-mono font-semibold text-[#E85B3F]">
                {Math.round(uploadProgress)}%
              </span>
            )}
          </div>

          {status === 'error' && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ecg-retry-btn"
              title="Retry analysis"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Screening</span>
            </button>
          )}
        </div>

        {/* Error Note if Error Occurred */}
        {status === 'error' && errorMessage && (
          <div className="mb-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            <strong>Analysis Halt:</strong> {errorMessage}
          </div>
        )}

        {/* Clinical Transparency & Acoustic Distinction Disclaimer */}
        <div className="ecg-disclaimer">
          <Info className="ecg-disclaimer-icon" aria-hidden="true" />
          <span>
            <strong>Illustrative monitoring display — not patient ECG tracing:</strong> CardioLens analyzes phonocardiogram (PCG) acoustic heart sounds using a deep CNN model. This visualization indicates active processing pipeline telemetry and is non-diagnostic.
          </span>
        </div>
      </div>
    </section>
  );
}
