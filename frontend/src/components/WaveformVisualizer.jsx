import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Activity } from 'lucide-react';

export default function WaveformVisualizer({ 
  audioSource, 
  waveformPoints = [], 
  duration = 0,
  autoPlay = false 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Generate synthetic smooth PCG envelope if no backend points provided yet
  const points = waveformPoints && waveformPoints.length > 0 
    ? waveformPoints 
    : Array.from({ length: 80 }, (_, i) => {
        // Natural S1-S2 heart sound envelope simulation
        const phase = (i % 20) / 20;
        const s1 = Math.exp(-Math.pow((phase - 0.2) / 0.08, 2)) * 0.9;
        const s2 = Math.exp(-Math.pow((phase - 0.6) / 0.08, 2)) * 0.7;
        const noise = (Math.sin(i * 1.5) * 0.15);
        return Math.min(1.0, Math.max(0.08, s1 + s2 + Math.abs(noise)));
      });

  // Resolve audio object URL
  useEffect(() => {
    let url = null;
    if (audioSource instanceof File || audioSource instanceof Blob) {
      url = URL.createObjectURL(audioSource);
      setAudioUrl(url);
    } else if (typeof audioSource === 'string') {
      setAudioUrl(audioSource);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioSource]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration || duration || 5.0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleReset = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleWaveformClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickRatio * (totalDuration || 5.0);

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressRatio = totalDuration > 0 ? (currentTime / totalDuration) : 0;

  return (
    <div className="w-full bg-white/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm backdrop-blur-md">
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}

      {/* Header with status & timestamp */}
      <div className="flex items-center justify-between mb-3 text-xs font-medium text-slate-500">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isPlaying ? 'bg-coral-50 text-[#E85B3F] border border-coral-200' : 'bg-slate-100 text-slate-600'
          }`}>
            <Activity className={`w-3 h-3 mr-1 ${isPlaying ? 'animate-pulse text-[#E85B3F]' : ''}`} />
            {isPlaying ? 'Acoustic Playback Active' : 'PCG Waveform Ready'}
          </span>
        </div>
        <div className="font-mono text-slate-700 font-semibold">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Interactive Waveform Display */}
      <div 
        onClick={handleWaveformClick}
        className="group relative h-20 sm:h-24 w-full bg-slate-50/80 rounded-xl p-2.5 flex items-center justify-between cursor-pointer border border-slate-100 overflow-hidden hover:border-coral-200 transition-colors"
        title="Click anywhere to seek"
      >
        {/* Playhead Progress Overlay */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-coral-50/30 border-r-2 border-[#E85B3F] transition-all pointer-events-none"
          style={{ width: `${progressRatio * 100}%` }}
        />

        {/* Amplitude Bars */}
        <div className="flex items-center justify-between w-full h-full space-x-0.5 sm:space-x-1 z-10">
          {points.map((pt, idx) => {
            const barRatio = idx / points.length;
            const hasPassed = barRatio <= progressRatio;
            // Scale bar height between 15% and 95%
            const heightPct = Math.max(12, Math.min(95, Math.abs(pt) * 100));

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-center items-center h-full"
              >
                <div
                  className={`w-full max-w-[4px] rounded-full transition-all duration-100 ${
                    hasPassed 
                      ? 'bg-gradient-to-t from-[#D9432B] to-[#E85B3F] shadow-sm' 
                      : 'bg-slate-300/70 group-hover:bg-slate-400/80'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-[#E85B3F] to-[#D9432B] hover:from-[#EE684E] hover:to-[#E85B3F] shadow-sm shadow-coral-500/30 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E85B3F]/40"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Restart from beginning"
            aria-label="Restart audio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-500 hidden sm:inline-block">
            {isPlaying ? 'Playing heart sound...' : 'Click play to listen'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-amber-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-400">2000 Hz PCG</span>
        </div>
      </div>
    </div>
  );
}
