import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export function CRTLandingPage() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<string>('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Matrix rain effect from your original code
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    
    const letters = Array(256).join('1').split('');
    
    const matrixInterval = setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f0';
      
      letters.map((y: string, i: number) => {
        const text = String.fromCharCode(3e4 + Math.random() * 33);
        const x = i * 10;
        ctx.fillText(text, x, parseInt(y));
        letters[i] = (parseInt(y) > 758 + Math.random() * 1e4) ? '0' : (parseInt(y) + 10).toString();
      });
    }, 33);

    // Random TV overlay selection from your original code
    const tvOverlays = [
      "exodus_Samsung_Day.png", 
      "exodus_Samsung_Night.png",
      "exodus_Trinitron_Day.png", 
      "exodus_Trinitron_Night.png"
    ];
    const chosenOverlay = tvOverlays[Math.floor(Math.random() * tvOverlays.length)];
    setSelectedOverlay(chosenOverlay);

    // Cleanup
    return () => {
      clearInterval(matrixInterval);
    };
  }, []);

  // Check if user is already authenticated and redirect immediately
  useEffect(() => {
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (isAuthenticated || (savedWallet && savedToken)) {
      setLocation('/home');
    }
  }, [isAuthenticated, setLocation]);

  const handleEnterReality = () => {
    // Check authentication status before navigation
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (isAuthenticated || (savedWallet && savedToken)) {
      setLocation('/home');
    } else {
      setLocation('/auth');
    }
  };

  return (
    <div className="bg-black text-green-400 font-mono fixed inset-0 w-full h-full overflow-hidden z-50">
      {/* Matrix Rain Canvas */}
      <canvas 
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      {/* CRT TV Frame Overlay */}
      {selectedOverlay && (
        <img 
          src={`/tv_skins/crt_frame_1749377946560.png`}
          alt="CRT Frame"
          className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30"
          style={{ zIndex: 999, mixBlendMode: 'overlay' }}
          onError={() => {
            console.log('TV overlay not found, using CSS frame instead');
          }}
        />
      )}

      {/* Main Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen" style={{ zIndex: 10 }}>
        
        {/* Title */}
        <h1 
          className="text-4xl mb-4 font-mono text-green-400"
          style={{ textShadow: '0 0 10px #00ff00' }}
        >
          🛡️ BEYOND THE SIMULATION 🛡️
        </h1>
        
        {/* Subtitle */}
        <div 
          className="text-xl mb-8 text-center max-w-2xl"
          style={{ textShadow: '0 0 8px #00ff00' }}
        >
          PIXELVAULT BLOCKCHAIN INTERFACE
        </div>

        {/* System Status Display */}
        <div className="font-mono text-sm mb-8 space-y-1 text-center">
          <div className="text-green-300">
            NETWORK STATUS: <span className="text-green-400 animate-pulse">ONLINE</span>
          </div>
          <div className="text-green-300">
            SECURITY LEVEL: <span className="text-green-400">MAXIMUM</span>
          </div>
          <div className="text-green-300">
            QUANTUM ENCRYPTION: <span className="text-green-400 animate-pulse">ACTIVE</span>
          </div>
        </div>
        
        {/* Enter Reality Button */}
        <Button
          onClick={handleEnterReality}
          className="mt-6 px-6 py-3 bg-green-400 text-black font-bold border-2 border-green-400 hover:bg-black hover:text-green-400 transition font-mono text-lg"
          style={{ 
            textShadow: 'none',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)'
          }}
        >
          ENTER BREATHING TERMINAL 🚀
        </Button>

        {/* Warning Footer */}
        <div className="mt-8 text-xs text-center space-y-1">
          <div 
            className="text-orange-400 animate-pulse"
            style={{ textShadow: '0 0 8px #ff6600' }}
          >
            WARNING: UNAUTHORIZED ACCESS DETECTED
          </div>
          <div className="text-green-600">
            BUILD 2025.06.08 | zkSNARK PROOF-OF-WORK CONSENSUS
          </div>
        </div>
      </div>

      {/* CSS Fallback CRT Frame if images don't load */}
      <div 
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 998,
          background: `
            radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.8) 100%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.02) 2px, rgba(0, 255, 0, 0.02) 4px)
          `,
          border: '20px solid #333',
          borderRadius: '15px'
        }}
      />
    </div>
  );
}