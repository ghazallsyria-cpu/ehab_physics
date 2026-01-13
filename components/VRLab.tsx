
import React, { useState, useEffect, useRef } from 'react';
import { PhysicsExperiment, SavedExperiment } from '../types';

interface VRLabProps {
  experiment: PhysicsExperiment;
  onBack: () => void;
}

const VRLab: React.FC<VRLabProps> = ({ experiment, onBack }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHapticActive, setIsHapticActive] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientY / innerHeight - 0.5) * 15;
      const y = (e.clientX / innerWidth - 0.5) * 15;
      setRotation({ x, y });
      setDepth(Math.abs(x) + Math.abs(y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    setTelemetry(['System Initialized', 'Neural Link Established', `Protocol: ${experiment.title}`]);
    
    const telemetryInterval = setInterval(() => {
        setTelemetry(prev => [...prev.slice(-6), `SIGNAL: ${Math.random().toString(36).substr(2, 6).toUpperCase()} SYNCED AT ${(Math.random()*100).toFixed(3)}%`]);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(telemetryInterval);
    };
  }, [experiment.title]);

  const triggerHaptic = () => {
    setIsHapticActive(true);
    // Use modern Vibration API if available
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => setIsHapticActive(false), 600);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#010304] font-['Tajawal'] text-white overflow-hidden flex items-center justify-center cursor-crosshair perspective-2000">
      {/* Immersive Quantum Grid */}
      <div 
        className="absolute inset-0 bg-grid-large bg-[#00d2ff]/5 transition-transform duration-100 ease-out pointer-events-none"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${1 + depth/100})` }}
      >
        <div className="absolute inset-0 nebula-glow opacity-20"></div>
      </div>

      {/* VR HUD System */}
      <div className="absolute inset-0 border-[40px] md:border-[80px] border-[#010304] pointer-events-none z-50">
         <div className="absolute top-12 left-1/2 -translate-x-1/2 px-14 py-4 bg-red-600/10 border border-red-500/30 rounded-full flex items-center gap-6 backdrop-blur-xl">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping shadow-[0_0_20px_#dc2626]"></div>
            <span className="text-[12px] font-black uppercase tracking-[0.8em] text-red-500 animate-pulse">Neural Reality Immersion Active</span>
         </div>

         {/* Left Telemetry Cluster */}
         <div className="absolute left-24 top-1/4 w-80 space-y-10 pointer-events-auto">
            <div className="glass-panel p-8 rounded-[40px] border-[#00d2ff]/20 bg-black/40">
               <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Stream</p>
                  <span className="w-2 h-2 bg-[#00d2ff] rounded-full animate-pulse"></span>
               </div>
               <div className="space-y-3 max-h-48 overflow-hidden font-mono">
                  {telemetry.map((t, i) => (
                    <p key={i} className="text-[11px] font-bold text-[#00d2ff] opacity-60 truncate animate-slideUp">>> {t}</p>
                  ))}
               </div>
            </div>
            <button 
              onClick={triggerHaptic} 
              className="w-full py-6 bg-white/5 border border-white/10 rounded-[30px] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#00d2ff] hover:text-black hover:border-[#00d2ff] transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              Test Kinetic Haptics
            </button>
         </div>

         {/* Right Control Cluster */}
         <div className="absolute right-24 top-1/4 w-80 pointer-events-auto space-y-10">
            <button onClick={onBack} className="w-full py-8 bg-red-600/10 border border-red-600/40 rounded-[40px] text-[12px] font-black uppercase tracking-[0.6em] text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(220,38,38,0.2)]">
               Deselect Immersion
            </button>
            <div className="glass-panel p-10 rounded-[50px] border-purple-500/30 bg-purple-900/5 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 text-[10px] font-black text-purple-500/20">AI OS</div>
               <span className="text-6xl mb-6 block animate-float-planet">🔮</span>
               <h4 className="text-lg font-black mb-3">System Guidance</h4>
               <p className="text-[11px] text-gray-400 italic leading-relaxed px-4">"تفاعل مع جزيئات المادة في هذا البعد. حرك يديك الافتراضية للتحكم في الضغط الكوانتومي."</p>
            </div>
         </div>
      </div>

      {/* Immersive Viewport */}
      <div 
        className={`relative w-full max-w-[1400px] aspect-video rounded-[100px] border-4 transition-all duration-500 ${isHapticActive ? 'scale-95 blur-md border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.5)]' : 'border-white/10 shadow-[0_60px_200px_rgba(0,0,0,0.9)]'}`}
        style={{ transform: `rotateX(${rotation.x * 0.4}deg) rotateY(${rotation.y * 0.4}deg)` }}
      >
         <div className="absolute inset-0 bg-gradient-to-tr from-[#00d2ff]/10 via-transparent to-purple-600/10 rounded-[100px] overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
               <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-12">
                     <div className="absolute inset-0 border-8 border-dashed border-[#00d2ff]/40 rounded-full animate-spin-slow"></div>
                     <div className="absolute inset-4 border-4 border-white/10 rounded-full"></div>
                     <div className="absolute inset-0 flex items-center justify-center text-5xl">⚛️</div>
                  </div>
                  <h3 className="text-6xl font-black tracking-tighter text-white/40 uppercase tracking-[0.6em] animate-pulse">Rendering Reality Node...</h3>
               </div>
            </div>
         </div>

         {/* Virtual Control Interface (Floaters) */}
         <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-12">
            {[
              { i: '🖐️', l: 'Kinetic' },
              { i: '🔧', l: 'Adjust' },
              { i: '🔍', l: 'Focus' },
              { i: '📊', l: 'Data' }
            ].map((tool, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl hover:scale-125 transition-all hover:bg-[#00d2ff]/20 hover:border-[#00d2ff] cursor-pointer shadow-2xl">
                  {tool.i}
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{tool.l}</span>
              </div>
            ))}
         </div>
      </div>
      
      {/* Cinematic Haptic Ripple */}
      {isHapticActive && <div className="fixed inset-0 z-[200] border-[40px] border-[#00d2ff] animate-ping opacity-20 pointer-events-none"></div>}
    </div>
  );
};

export default VRLab;
