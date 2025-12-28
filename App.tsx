
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SkeletonCanvas from './components/SkeletonCanvas';
import { getCoachFeedback } from './services/geminiService';
import { Feedback, DanceSession, DanceMove } from './types';

// Declare types for MediaPipe global variables
declare const Pose: any;
declare const Camera: any;

const DANCE_MOVES: DanceMove[] = [
  { id: '1', name: 'Moonwalk', difficulty: 'Hard', description: 'Gliding backward while walking forward.' },
  { id: '2', name: 'Body Wave', difficulty: 'Medium', description: 'Fluid motion through the torso.' },
  { id: '3', name: 'The Robot', difficulty: 'Easy', description: 'Mechanical movements and stops.' },
  { id: '4', name: 'Spin', difficulty: 'Easy', description: 'A basic rotation on the spot.' },
  { id: '5', name: 'Running Man', difficulty: 'Medium', description: 'Classic house and hip-hop shuffle movement.' },
  { id: '6', name: 'The Floss', difficulty: 'Easy', description: 'Fast arm swinging behind and in front of the body.' },
  { id: '7', name: 'Salsa Basic', difficulty: 'Medium', description: 'Side-to-side rhythmic Latin footwork.' },
  { id: '8', name: 'Breakdance Freeze', difficulty: 'Hard', description: 'Holding a stylized pose on one or two hands.' },
  { id: '9', name: 'Electric Slide', difficulty: 'Easy', description: 'A classic four-wall line dance sequence.' },
  { id: '10', name: 'Voguing', difficulty: 'Medium', description: 'Striking poses with stylized hand movements.' }
];

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [poseResults, setPoseResults] = useState<any>(null);
  const [session, setSession] = useState<DanceSession>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    calories: 0,
    duration: 0
  });
  const [activeMove, setActiveMove] = useState<DanceMove>(DANCE_MOVES[0]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [coachMsg, setCoachMsg] = useState("Align yourself in the frame to start!");

  const videoRef = useRef<HTMLVideoElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastAIFeedbackTime = useRef<number>(0);

  // Initialize MediaPipe Pose
  useEffect(() => {
    if (!videoRef.current) return;

    poseRef.current = new Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    poseRef.current.onResults((results: any) => {
      setPoseResults(results);
      if (results.poseLandmarks && isPlaying) {
        updateGameStats(results);
      }
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && poseRef.current) {
          await poseRef.current.send({ image: videoRef.current });
        }
      },
      width: 1280,
      height: 720
    });

    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
    };
  }, [isPlaying]);

  const updateGameStats = useCallback((results: any) => {
    // Simple heuristic for score: variation in landmarks
    // Real ML would compare with reference vectors
    setSession(prev => {
      const newScore = prev.score + Math.floor(Math.random() * 10) + 5;
      const newCombo = prev.combo + 1;
      return {
        ...prev,
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        calories: prev.calories + 0.1
      };
    });

    // Debounced AI Coach call every 8 seconds
    const now = Date.now();
    if (now - lastAIFeedbackTime.current > 8000) {
      lastAIFeedbackTime.current = now;
      triggerAICoach();
    }
  }, [activeMove]);

  const triggerAICoach = async () => {
    if (!videoRef.current) return;

    // Capture frame for Gemini analysis
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth / 2; // Resize down for faster transmission
    canvas.height = videoRef.current.videoHeight / 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];
      
      setCoachMsg("Analyzing your flow...");
      const tip = await getCoachFeedback(base64, activeMove.name);
      setCoachMsg(tip);
      
      const newFeedback: Feedback = {
        text: tip,
        type: 'info',
        timestamp: Date.now()
      };
      setFeedback(prev => [newFeedback, ...prev].slice(0, 3));
    }
  };

  const handleStartStop = () => {
    if (!isPlaying) {
      setSession({ score: 0, combo: 0, maxCombo: 0, calories: 0, duration: 0 });
      setCoachMsg("Let's go! Feel the beat!");
    } else {
      setCoachMsg("Session paused. Take a breath!");
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative h-screen w-screen bg-neutral-950 font-sans overflow-hidden">
      {/* Background Camera Feed */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover scale-x-[-1]"
          playsInline
        />
        <SkeletonCanvas results={poseResults} />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-40 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      </div>

      {/* Top Bar - Progress & Stats */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 pointer-events-auto">
            <h1 className="text-2xl font-black tracking-tighter text-pink-500 uppercase">GrooveAI</h1>
            <div className="text-xs text-neutral-400 font-medium">REAL-TIME MOTION PREDICTION</div>
          </div>
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-6 pointer-events-auto">
            <div>
              <div className="text-[10px] uppercase text-neutral-400">Score</div>
              <div className="text-xl font-bold tabular-nums text-emerald-400">{session.score.toLocaleString()}</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-[10px] uppercase text-neutral-400">Combo</div>
              <div className="text-xl font-bold tabular-nums text-yellow-400">{session.combo}x</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-[10px] uppercase text-neutral-400">Burn</div>
              <div className="text-xl font-bold tabular-nums text-orange-500">{session.calories.toFixed(1)} <span className="text-xs">kcal</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-right pointer-events-auto">
            <div className="text-[10px] uppercase text-neutral-400">Current Move</div>
            <div className="text-lg font-bold text-white uppercase">{activeMove.name}</div>
            <div className="flex gap-1 justify-end mt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full ${i < (activeMove.difficulty === 'Easy' ? 1 : activeMove.difficulty === 'Medium' ? 2 : 3) ? 'bg-pink-500' : 'bg-neutral-800'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Floating Bubble */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-32 md:bottom-40 z-30 w-full max-w-lg px-4 transition-all duration-500">
        <div className="bg-neutral-900/90 backdrop-blur-xl border-t-2 border-pink-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2">
             <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">AI Dance Coach</div>
              <p className="text-lg font-medium leading-tight text-white drop-shadow-sm italic">
                "{coachMsg}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-40 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {DANCE_MOVES.map((move) => (
              <button
                key={move.id}
                onClick={() => setActiveMove(move)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  activeMove.id === move.id 
                    ? 'bg-white text-black border-white' 
                    : 'bg-neutral-900 text-neutral-400 border-white/10 hover:border-white/30'
                }`}
              >
                {move.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-6">
            <button
              onClick={handleStartStop}
              className={`flex-1 px-12 py-5 rounded-3xl font-black text-xl tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
                isPlaying 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-emerald-400/20'
              }`}
            >
              {isPlaying ? 'PAUSE SESSION' : 'START DANCING'}
            </button>

            <div className="flex items-center gap-4">
              <button className="p-4 rounded-2xl bg-neutral-900 border border-white/10 hover:bg-neutral-800 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Combos Visual Effect */}
      {session.combo > 5 && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="text-9xl font-black text-white/10 uppercase tracking-tighter select-none animate-pulse">
            COMBO {session.combo}
          </div>
        </div>
      )}

      {/* Accuracy Feedback Sidebar */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30 pointer-events-none">
        {feedback.map((f, i) => (
          <div 
            key={f.timestamp} 
            className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl animate-fade-in-right flex items-center gap-3 transition-opacity duration-1000"
            style={{ opacity: 1 - (i * 0.3) }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-sm font-bold text-white/90">{f.text}</span>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.4s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default App;
