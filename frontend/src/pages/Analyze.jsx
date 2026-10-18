import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileAudio, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  Cpu, 
  ShieldAlert, 
  Info, 
  Sliders, 
  History, 
  Trash2, 
  FileText, 
  BarChart2, 
  Play,
  ArrowRight,
  Stethoscope
} from 'lucide-react';
import { 
  predictAudio, 
  getSampleAudios, 
  getSampleStreamUrl, 
  downloadReportPdf 
} from '../services/api';
import WaveformVisualizer from '../components/WaveformVisualizer';
import ECGMonitor from '../components/ECGMonitor';

export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Demo Samples
  const [sampleAudios, setSampleAudios] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

  // History Drawer State
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fileInputRef = useRef(null);

  // Load sample audios and session history on mount
  useEffect(() => {
    getSampleAudios()
      .then(samples => setSampleAudios(samples))
      .catch(err => console.warn('Could not fetch sample audios:', err));

    try {
      const stored = localStorage.getItem('cardiolens_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse local history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (result) => {
    const entry = {
      analysis_id: result.analysis_id,
      timestamp: result.timestamp,
      label: result.prediction.label,
      confidence: result.prediction.confidence,
      confidence_percentage: result.prediction.confidence_percentage,
      filename: result.audio.filename,
      duration: result.audio.original_duration_seconds,
      result_data: result
    };

    setHistory(prev => {
      const updated = [entry, ...prev.filter(item => item.analysis_id !== result.analysis_id)].slice(0, 20);
      try {
        localStorage.setItem('cardiolens_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('cardiolens_history');
    } catch (e) {}
  };

  // Handle local file selection
  const handleFileChange = (file) => {
    if (!file) return;

    // Reset previous results and errors
    setErrorMessage(null);
    setAnalysisResult(null);
    setSelectedSampleId(null);
    setAnalysisStatus('idle');
    setUploadProgress(0);

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac'];
    if (!allowed.includes(ext)) {
      setErrorMessage(`Unsupported format '${ext}'. Please upload an audio file in ${allowed.join(', ')}.`);
      setAnalysisStatus('error');
      return;
    }

    // Validate size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("The selected file exceeds the 25 MB limit. Please select a shorter recording.");
      setAnalysisStatus('error');
      return;
    }

    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || 'audio/wav',
      isSample: false
    });
  };

  // Select pre-loaded demo sample
  const handleSelectSample = async (sample) => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setSelectedSampleId(sample.id);
    setAnalysisStatus('idle');
    setUploadProgress(0);

    try {
      const streamUrl = getSampleStreamUrl(sample.id);
      const response = await fetch(streamUrl);
      if (!response.ok) throw new Error("Could not fetch sample audio.");

      const blob = await response.blob();
      const file = new File([blob], sample.filename, { type: 'audio/wav' });

      setSelectedFile(file);
      setFileDetails({
        name: `${sample.title} (${sample.filename})`,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: 'audio/wav',
        isSample: true,
        sampleInfo: sample
      });
    } catch (err) {
      setErrorMessage(`Failed to load sample: ${err.message}`);
      setAnalysisStatus('error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDetails(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setSelectedSampleId(null);
    setAnalysisStatus('idle');
    setUploadProgress(0);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Real AI Inference
  const handleRunAnalysis = async () => {
    if (isAnalyzing) return; // Prevent duplicate concurrent submissions

    if (!selectedFile) {
      setErrorMessage("Please select or upload a heart sound recording first.");
      setAnalysisStatus('error');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep(1);
    setUploadProgress(0);
    setAnalysisStatus('uploading');

    // Multi-step progress visualizer animation
    const stepTimers = [
      setTimeout(() => setAnalysisStep(2), 500),
      setTimeout(() => {
        setAnalysisStep(3);
        setAnalysisStatus('processing');
      }, 1100),
      setTimeout(() => setAnalysisStep(4), 1700),
    ];

    try {
      const result = await predictAudio(selectedFile, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) {
          setAnalysisStatus('processing');
        } else {
          setAnalysisStatus('uploading');
        }
      });

      // Clear timers and finish
      stepTimers.forEach(clearTimeout);
      setAnalysisStep(5);

      setTimeout(() => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
        setAnalysisStatus('complete');
        saveToHistory(result);
      }, 500);

    } catch (err) {
      stepTimers.forEach(clearTimeout);
      setIsAnalyzing(false);
      setAnalysisStatus('error');
      const msg = err.response?.data?.error || err.message || "An unexpected error occurred during audio analysis.";
      setErrorMessage(msg);
    }
  };

  // Download PDF Report
  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    setIsDownloadingPdf(true);
    try {
      await downloadReportPdf(analysisResult);
    } catch (err) {
      alert("Failed to download PDF report: " + err.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#E85B3F] uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>CardioLens AI Diagnostic Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Heart Sound Murmur Screening
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze phonocardiograms using your trained deep learning CNN model.
          </p>
        </div>

        {/* Screening History Toggle Button */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-colors"
          >
            <History className="w-4 h-4 text-[#E85B3F]" />
            <span>Screening History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-coral-50 text-[#E85B3F] font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          ERROR MESSAGE BANNER
          ========================================================================= */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start space-x-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">Recording Analysis Notice</span>
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          PRE-PACKAGED CLINICAL DEMO SAMPLES CAROUSEL
          ========================================================================= */}
      {sampleAudios.length > 0 && !analysisResult && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#E85B3F]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Try Pre-Loaded Clinical Samples (One-Click Test)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">PhysioNet CirCor Dataset</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sampleAudios.map(sample => {
              const isSelected = selectedSampleId === sample.id;
              const isNormal = sample.expected_class === 'Normal';

              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-[#E85B3F] bg-coral-50/40 shadow-xs' 
                      : 'border-slate-200/70 bg-white/70 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isNormal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sample.expected_class}
                    </span>
                    <Play className="w-3 h-3 text-[#E85B3F]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {sample.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {sample.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          CLINICAL ECG-STYLE SIGNAL MONITOR (Telemetry Visualizer)
          ========================================================================= */}
      <ECGMonitor 
        status={analysisStatus}
        uploadProgress={uploadProgress}
        errorMessage={errorMessage}
        onRetry={handleRunAnalysis}
      />

      {/* =========================================================================
          UPLOAD & PREVIEW SECTION (When no result is active yet)
          ========================================================================= */}
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dropzone & Audio Preview */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* File Drag & Drop Area */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`glass-panel border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#E85B3F] bg-coral-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-coral-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav,.mp3,.ogg,.flac,.m4a,.aac"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-coral-50 text-[#E85B3F] flex items-center justify-center mx-auto mb-4 border border-coral-200/60 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  Upload Heart Sound Recording
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Drag and drop your audio file here, or browse files from your local storage.
                </p>

                <div className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold btn-coral-primary shadow-xs">
                  Browse Audio Files
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>Supported: WAV, MP3, OGG, FLAC</span>
                  <span>•</span>
                  <span>Max Size: 25 MB</span>
                  <span>•</span>
                  <span>Target Length: 5.0 seconds</span>
                </div>
              </div>
            ) : (
              /* Selected Audio Preview Card */
              <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
                
                {/* File Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-coral-50 text-[#E85B3F] flex items-center justify-center border border-coral-200/60">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md">
                        {fileDetails?.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <span>{fileDetails?.size}</span>
                        <span>•</span>
                        <span>Format: {fileDetails?.type}</span>
                        {fileDetails?.isSample && (
                          <>
                            <span>•</span>
                            <span className="text-[#E85B3F] font-semibold">Demo Sample</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Replace file"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Real Waveform Playback Visualizer */}
                <WaveformVisualizer audioSource={selectedFile} />

                {/* Analysis Action Callout */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 block">Ready for CNN Model Screening</span>
                    <span>Standardized preprocessing at 2000 Hz, 128 Mel bands.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold btn-coral-primary shadow-md shadow-coral-500/25 disabled:opacity-60 transition-all"
                  >
                    {isAnalyzing ? (
                      <span className="inline-flex items-center">
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        <span>Running Model...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        <span>Analyze Heart Sound</span>
                      </span>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* In-Flight Analysis Progress State */}
            {isAnalyzing && (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-coral-200/80 shadow-md space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-2 text-[#E85B3F]">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Processing Heart Sound Recording</span>
                  </span>
                  <span>Step {analysisStep} of 5</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#E85B3F] to-[#D9432B] transition-all duration-300"
                    style={{ width: `${(analysisStep / 5) * 100}%` }}
                  />
                </div>

                {/* Sequential Step Labels */}
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className={`flex items-center space-x-2 ${analysisStep >= 1 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 1 ? 'text-[#E85B3F]' : 'text-slate-300'}`} />
                    <span>Decoding audio & validating acoustic amplitude</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${analysisStep >= 2 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 2 ? 'text-[#E85B3F]' : 'text-slate-300'}`} />
                    <span>Standardizing sample rate to 2000 Hz PCG format (5.0s window)</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${analysisStep >= 3 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 3 ? 'text-[#E85B3F]' : 'text-slate-300'}`} />
                    <span>Computing 128-band normalized Log-Mel Spectrogram</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${analysisStep >= 4 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 4 ? 'text-[#E85B3F]' : 'text-slate-300'}`} />
                    <span>Executing HeartSoundCNN forward pass & Softmax classification</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${analysisStep >= 5 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 5 ? 'text-[#E85B3F]' : 'text-slate-300'}`} />
                    <span>Synthesizing screening report & acoustic metrics</span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Model Information & Guidance Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Technical Specifications Glass Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Model Pipeline Specifications
              </h4>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Architecture</span>
                  <span className="font-bold text-slate-900">HeartSoundCNN</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Sample Rate</span>
                  <span className="font-mono font-semibold text-slate-900">2000 Hz</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Analysis Duration</span>
                  <span className="font-mono font-semibold text-slate-900">5.0 seconds</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Spectrogram Bins</span>
                  <span className="font-mono font-semibold text-slate-900">128 Mel bands</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Cutoff Frequency (fmax)</span>
                  <span className="font-mono font-semibold text-slate-900">1000 Hz</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Classifier Output</span>
                  <span className="font-bold text-[#E85B3F]">2 Classes (Binary)</span>
                </div>
              </div>
            </div>

            {/* Privacy & Handling Note */}
            <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                <Info className="w-4 h-4 text-[#E85B3F]" />
                <span>Audio Privacy & Safety</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your audio recording is processed strictly in temporary server memory to produce the spectrogram. It is never stored in persistent databases or shared with external third parties.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          RESULTS INTERFACE (Rendered when prediction completes)
          ========================================================================= */}
      {analysisResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Action Toolbar Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
                {analysisResult.analysis_id}
              </span>
              <span className="text-xs text-slate-400">
                Analyzed at {new Date(analysisResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={() => setIsJsonModalOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="View Technical JSON"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Raw Data</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-bold text-[#E85B3F] hover:bg-coral-50 border border-coral-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Analyze Another</span>
              </button>
            </div>
          </div>

          {/* Main Result Card */}
          {(() => {
            const pred = analysisResult.prediction;
            const isMurmur = pred.label === "Murmur Present";
            const normalProb = pred.probabilities?.normal || 0;
            const murmurProb = pred.probabilities?.murmur_present || 0;

            return (
              <div className={`glass-panel rounded-3xl p-6 sm:p-10 border shadow-md space-y-8 ${
                isMurmur 
                  ? 'border-amber-200/80 bg-gradient-to-br from-white via-white/95 to-amber-50/20' 
                  : 'border-emerald-200/80 bg-gradient-to-br from-white via-white/95 to-emerald-50/20'
              }`}>
                
                {/* Result Title & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Model Classification Outcome
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
                      <span>{pred.label}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isMurmur ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pred.badge}
                      </span>
                    </h2>
                  </div>

                  {/* Confidence Score Pill */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                      Classification Confidence
                    </span>
                    <span className="text-3xl font-black font-mono text-slate-900">
                      {pred.confidence_percentage}%
                    </span>
                  </div>
                </div>

                {/* Probability Distribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Normal Probability: {(normalProb * 100).toFixed(1)}%</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E85B3F]" />
                      <span>Murmur Probability: {(murmurProb * 100).toFixed(1)}%</span>
                    </span>
                  </div>

                  {/* Progress Split Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${normalProb * 100}%` }}
                      title={`Normal: ${(normalProb * 100).toFixed(1)}%`}
                    />
                    <div 
                      className="h-full bg-[#E85B3F] transition-all duration-500" 
                      style={{ width: `${murmurProb * 100}%` }}
                      title={`Murmur: ${(murmurProb * 100).toFixed(1)}%`}
                    />
                  </div>
                </div>

                {/* Clinical Interpretation Box */}
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-[#E85B3F]" />
                    <span>Clinical Interpretation</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {pred.clinical_summary}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                    <b>Recommendation:</b> {pred.clinical_recommendation}
                  </p>
                </div>

                {/* Acoustic Recording Waveform in Result Context */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-[#E85B3F]" />
                      <span>Audio Recording & Waveform</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {analysisResult.audio.sample_rate_hz} Hz Standard
                    </span>
                  </div>
                  <WaveformVisualizer 
                    audioSource={selectedFile} 
                    waveformPoints={analysisResult.audio.waveform}
                    duration={analysisResult.audio.processed_duration_seconds}
                  />
                </div>

                {/* Acoustic Specifications Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Original Duration</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {analysisResult.audio.original_duration_seconds}s
                    </span>
                  </div>
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">RMS Signal Energy</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {analysisResult.audio.rms_energy}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Peak Amplitude</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {analysisResult.audio.peak_amplitude}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Inference Time</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {analysisResult.processing_time_ms} ms
                    </span>
                  </div>
                </div>

                {/* Log-Mel Spectrogram Matrix Preview */}
                {analysisResult.audio.spectrogram_preview && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Log-Mel Spectrogram Matrix (128 Bands, fmax=1000Hz)</span>
                      <span className="text-[10px] text-slate-400">Time Frames: 20</span>
                    </div>
                    
                    {/* Visual Spectrogram Heatmap */}
                    <div className="h-20 w-full rounded-xl overflow-hidden bg-slate-950 p-1 flex flex-col justify-between">
                      {analysisResult.audio.spectrogram_preview.map((row, rIdx) => (
                        <div key={rIdx} className="flex-1 flex space-x-0.5">
                          {row.map((val, cIdx) => {
                            // Map 0-1 to coral heat gradient
                            const r = Math.round(232 * val + 30 * (1 - val));
                            const g = Math.round(91 * val + 35 * (1 - val));
                            const b = Math.round(63 * val + 50 * (1 - val));
                            return (
                              <div
                                key={cIdx}
                                className="flex-1 h-full"
                                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                                title={`Freq bin ${rIdx*8}, Frame ${cIdx}: ${val}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Responsibility Disclaimer Footer */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                  <b>Medical Disclaimer:</b> {analysisResult.disclaimer}
                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* =========================================================================
          SCREENING HISTORY DRAWER (Modal / Slide-Over)
          ========================================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-hidden">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-[#E85B3F]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Session Screening History
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-normal">
                These records are saved locally in your current browser session. They are not stored in any external database.
              </p>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No screenings in this session yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {history.map((item, idx) => {
                    const isMurmur = item.label === "Murmur Present";
                    return (
                      <div
                        key={item.analysis_id || idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isMurmur ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.label}
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {item.filename}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Confidence: {item.confidence_percentage}%</span>
                          {item.result_data && (
                            <button
                              type="button"
                              onClick={() => {
                                setAnalysisResult(item.result_data);
                                setAnalysisStatus('complete');
                                setIsHistoryOpen(false);
                              }}
                              className="text-[#E85B3F] font-bold hover:underline"
                            >
                              View Result
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900"
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          TECHNICAL JSON MODAL
          ========================================================================= */}
      {isJsonModalOpen && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                Diagnostic Output JSON Payload
              </h3>
              <button 
                type="button" 
                onClick={() => setIsJsonModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <pre className="mt-4 p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] max-h-[60vh] overflow-y-auto leading-relaxed">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
