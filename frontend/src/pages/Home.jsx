import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  Activity, 
  Cpu, 
  AudioWaveform, 
  ShieldAlert, 
  ArrowRight, 
  Upload, 
  Sliders, 
  BarChart3, 
  History, 
  CheckCircle2, 
  Stethoscope, 
  FileCheck2, 
  Sparkles, 
  ChevronDown, 
  Building2, 
  Users2, 
  Microscope 
} from 'lucide-react';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const coreCapabilities = [
    {
      icon: Cpu,
      title: "AI Heart Sound Analysis",
      description: "Classifies phonocardiogram (PCG) acoustic recordings into Normal or Murmur Present using your trained deep learning CNN.",
      badge: "Deep Learning CNN"
    },
    {
      icon: Activity,
      title: "Audio Signal Processing",
      description: "Standardizes recordings at 2000 Hz, padding or trimming to 5.0 seconds and converting acoustic pressure into 128-band Log-Mel spectrograms.",
      badge: "2000 Hz Log-Mel"
    },
    {
      icon: BarChart3,
      title: "Explainable Screening Results",
      description: "Delivers the model's actual predicted class alongside calibrated confidence scores, probability distributions, and clinical guidance.",
      badge: "Calibrated Probabilities"
    },
    {
      icon: History,
      title: "Screening History & Reports",
      description: "Stores screening records safely in your local browser session and generates downloadable hospital-grade PDF summaries with timestamps.",
      badge: "PDF Reports & Session Logs"
    }
  ];

  const timelineSteps = [
    {
      step: "01",
      icon: Upload,
      title: "Upload Recording",
      description: "Select or drag a supported heart sound audio file (.wav, .mp3, .ogg, .flac) or try our pre-packaged clinical demo samples."
    },
    {
      step: "02",
      icon: Sliders,
      title: "Acoustic Preprocessing",
      description: "The backend validates the file, standardizes sample rate to 2000 Hz, enforces a 5-second analysis window, and computes normalized Mel bands."
    },
    {
      step: "03",
      icon: Cpu,
      title: "Neural Network Inference",
      description: "The existing trained CardioLens CNN evaluates the 4D spectrogram tensor and generates class scores through a Softmax output layer."
    },
    {
      step: "04",
      icon: FileCheck2,
      title: "Review & Report",
      description: "Inspect the predicted classification, acoustic metadata, audio waveform, and download a verifiable PDF screening report."
    }
  ];

  const hospitalGalleries = [
    {
      image: "/images/hospital-exterior.png",
      title: "Modern Clinical Facilities",
      subtitle: "State-of-the-art cardiovascular screening environment"
    },
    {
      image: "/images/diagnostic-suite.png",
      title: "Acoustic Diagnostic Suite",
      subtitle: "Equipped for calibrated digital phonocardiogram capture"
    },
    {
      image: "/images/hospital-lounge.png",
      title: "Cardiology Patient Lounge",
      subtitle: "Welcoming and comfortable healthcare consultation atmosphere"
    },
    {
      image: "/images/doctor-consultation.png",
      title: "Physician Auscultation Consult",
      subtitle: "Collaborative clinician review of AI screening predictions"
    }
  ];

  const faqs = [
    {
      q: "What is a phonocardiogram (PCG) recording?",
      a: "A phonocardiogram is a high-fidelity digital recording of the acoustic sounds produced by the mechanical action of the heart valves (S1 and S2) and blood flow through the cardiac chambers."
    },
    {
      q: "How does the CardioLens AI CNN detect heart murmurs?",
      a: "CardioLens converts raw PCG audio into a Log-Mel spectrogram, representing sound frequencies over time as a 2D image matrix. The trained 3-stage Convolutional Neural Network detects high-frequency turbulence and abnormal acoustic energy characteristic of heart murmurs."
    },
    {
      q: "Can CardioLens replace my cardiologist's diagnosis?",
      a: "No. CardioLens is an auxiliary screening and educational support tool. It provides probabilistic screening output but does not replace physical stethoscope auscultation, clinical history review, or diagnostic echocardiograms."
    },
    {
      q: "Are my uploaded recordings stored permanently on a server?",
      a: "No. Uploaded files are processed strictly in volatile system memory during inference and are automatically cleaned up. Your screening history is stored securely only within your local browser session."
    }
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative pt-8 sm:pt-14 pb-12 overflow-hidden">
        
        {/* Soft Hospital Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-coral-200/30 via-orange-100/20 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 border border-slate-200/80 shadow-xs text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#E85B3F] animate-pulse" />
                <span>AI-Assisted Phonocardiogram Screening</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#E85B3F] font-bold">Trained PyTorch CNN</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Listen Beyond <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#E85B3F] via-[#D9432B] to-[#991B1B] bg-clip-text text-transparent">
                  the Beat.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                AI-assisted heart sound screening that helps identify potential heart murmurs from phonocardiogram recordings.
              </p>

              <p className="text-sm sm:text-base text-slate-500 leading-normal max-w-xl mx-auto lg:mx-0">
                Upload a heart sound recording and receive an AI-generated screening result with clear, understandable information.
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/analyze"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-bold btn-coral-primary shadow-lg shadow-coral-500/20 group"
                >
                  <Stethoscope className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  <span>Analyze Heart Sound</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
                >
                  Explore How It Works
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>2000 Hz Resampling Standard</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Log-Mel Spectrogram Pipeline</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Private In-Memory Processing</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Interactive Glass Card Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Glass Card */}
                <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-xl border border-white/80 relative z-10 overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-coral-50 text-[#E85B3F] flex items-center justify-center border border-coral-200/60 shadow-xs">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          AI-Powered PCG Analysis
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Convolutional Acoustic Classifier
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live CNN Active
                    </span>
                  </div>

                  {/* Animated Simulated PCG Rhythm Visualizer */}
                  <div className="my-5 py-4 px-3 bg-slate-50/90 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                      <span>S1 Systole</span>
                      <span className="text-[#E85B3F] font-semibold">5.0s Acoustic Window</span>
                      <span>S2 Diastole</span>
                    </div>

                    {/* SVG Heart Waveform */}
                    <div className="h-20 w-full flex items-center justify-center overflow-hidden">
                      <svg className="w-full h-full text-[#E85B3F]" viewBox="0 0 400 80" fill="none">
                        <path
                          d="M 0 40 L 40 40 L 50 35 L 60 40 L 75 40 L 85 10 L 95 70 L 105 30 L 115 45 L 125 40 L 170 40 L 180 32 L 190 40 L 210 40 L 220 12 L 230 68 L 240 28 L 250 44 L 260 40 L 310 40 L 320 34 L 330 40 L 350 40 L 360 14 L 370 66 L 380 32 L 390 42 L 400 40"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-90"
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                      <span>Sampling Rate: 2000 Hz</span>
                      <span>128 Mel Bins</span>
                    </div>
                  </div>

                  {/* Sample Preview Information Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Duration</span>
                      <span className="text-slate-900 font-bold text-sm">5.0 Seconds</span>
                    </div>
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Supported Formats</span>
                      <span className="text-slate-900 font-bold text-sm">WAV, MP3, OGG, FLAC</span>
                    </div>
                  </div>

                  {/* Interactive Trigger CTA */}
                  <Link
                    to="/analyze"
                    className="w-full py-3 rounded-xl text-xs font-bold text-center block btn-coral-primary transition-all"
                  >
                    Open Analysis Workspace
                  </Link>
                </div>

                {/* Floating Glass Badge 1 */}
                <div className="absolute -top-4 -left-4 glass-panel py-2 px-3.5 rounded-2xl text-xs font-semibold text-slate-800 shadow-md border border-white z-20 hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>100% Local Inference Ready</span>
                </div>

                {/* Floating Glass Badge 2 */}
                <div className="absolute -bottom-4 -right-4 glass-panel py-2 px-3.5 rounded-2xl text-xs font-semibold text-slate-800 shadow-md border border-white z-20 hidden sm:flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#E85B3F]" />
                  <span>Explainable Confidence Scores</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          CORE CAPABILITIES SECTION (4 Glassmorphism Cards)
          ========================================================================= */}
      <section id="features" className="scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E85B3F]">
              Engineering & Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Core Diagnostic Capabilities
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Built on verified digital signal processing routines and real convolutional neural network inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreCapabilities.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.title}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-coral-50/80 text-[#E85B3F] flex items-center justify-center border border-coral-200/50 shadow-xs">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{card.badge}</span>
                    <span className="text-[#E85B3F]">0{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          HOW IT WORKS (4-Step Timeline)
          ========================================================================= */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E85B3F]">
              Screening Workflow
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              How CardioLens Evaluates PCG Audio
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A four-step standardized pipeline taking raw digital acoustic phonocardiograms through inference to clear clinical summaries.
            </p>
          </div>

          {/* Desktop Horizontal / Mobile Vertical Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {timelineSteps.map((item, idx) => {
              const StepIcon = item.icon;
              return (
                <div 
                  key={item.step} 
                  className="glass-panel rounded-2xl p-6 relative flex flex-col justify-between border border-slate-200/70"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-coral-200 font-mono">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60">
                        <StepIcon className="w-5 h-5 text-[#E85B3F]" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phase {idx + 1} of 4
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          CLINICAL ENVIRONMENT & TECHNOLOGY GALLERY (Visual Showcase)
          ========================================================================= */}
      <section id="about" className="scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-xl space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#E85B3F]">
                Clinical Excellence
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for Medical Auscultation Suites
              </h3>
              <p className="text-xs text-slate-600">
                Crafted to integrate cleanly into clinical diagnostic suites, cardiology clinics, and telemedicine environments.
              </p>
            </div>
            <Link
              to="/analyze"
              className="mt-4 md:mt-0 text-xs font-bold text-[#E85B3F] hover:text-[#D9432B] inline-flex items-center group"
            >
              <span>Test with Clinical Demo Samples</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hospitalGalleries.map((item) => (
              <div 
                key={item.title}
                className="group glass-panel rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all"
              >
                <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-4 bg-white/90">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================================
          CLINICAL RESPONSIBILITY & MEDICAL DISCLAIMER SECTION
          ========================================================================= */}
      <section id="clinical" className="scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-coral-200/60 bg-gradient-to-br from-white/95 via-white/90 to-coral-50/20 shadow-md">
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Essential Medical Disclaimer
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Clinical Responsibility & Screening Limitations
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  CardioLens is an investigational artificial intelligence platform designed to assist and educate, not replace medical judgment.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85B3F] mt-1.5 shrink-0" />
                    <span><b>Not a Diagnosis:</b> Output represents mathematical class probability and does not confirm cardiac pathology.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85B3F] mt-1.5 shrink-0" />
                    <span><b>Physician Evaluation:</b> Predictions cannot substitute for physical auscultation by an authorized clinician.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85B3F] mt-1.5 shrink-0" />
                    <span><b>Disease Exclusions:</b> A normal prediction does not rule out non-murmuring heart conditions (arrhythmias, CAD).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85B3F] mt-1.5 shrink-0" />
                    <span><b>Symptom Escalation:</b> Any concerning symptoms (dyspnea, syncope, chest tightness) require immediate emergency care.</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          FAQ ACCORDION SECTION
          ========================================================================= */}
      <section id="faq" className="scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E85B3F]">
              Frequently Asked Questions
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Understanding PCG AI Screening
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={faq.q}
                className="glass-panel rounded-2xl overflow-hidden border border-slate-200/70"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-[#E85B3F] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-[#E85B3F]' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 pt-3 bg-white/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================================
          FINAL ACTION BANNER
          ========================================================================= */}
      <section className="pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-white via-white/95 to-coral-50/40 border border-coral-200/50 shadow-lg space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E85B3F] to-[#D9432B] text-white flex items-center justify-center mx-auto shadow-md shadow-coral-500/20">
              <HeartPulse className="w-6 h-6 animate-heart-pulse" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Ready to Screen a Heart Sound?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Upload your digital PCG recording or run instant one-click tests using our pre-loaded normal and murmur samples.
              </p>
            </div>
            <Link
              to="/analyze"
              className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-bold btn-coral-primary shadow-lg shadow-coral-500/30"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              <span>Launch Heart Sound Analysis</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
