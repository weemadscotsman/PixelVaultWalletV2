import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function CRTLandingPage() {
  const [, setLocation] = useLocation();

  const handleEnterReality = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden z-50">
      {/* CRT Screen */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 100, 0, 0.2), rgba(0, 0, 0, 1))'
        }}
      >
        
        {/* CRT Effects Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanlines */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
              animation: 'scanlineMove 2s linear infinite'
            }}
          />
          
          {/* Static Noise */}
          <div className="absolute inset-0 opacity-10 animate-pulse bg-gradient-to-br from-green-500/10 via-transparent to-green-500/10" />
          
          {/* Vignette */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%)'
            }}
          />
          
          {/* Screen Glow */}
          <div 
            className="absolute -inset-5 animate-pulse" 
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0, 255, 0, 0.1), transparent 70%)'
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-4xl p-8">
          
          {/* Terminal Header */}
          <div 
            className="font-mono text-green-400 mb-8"
            style={{ textShadow: '0 0 10px #00ff00' }}
          >
            <div className="text-sm font-bold mb-1 tracking-widest">
              PIXELVAULT BLOCKCHAIN INTERFACE v2.1.7
            </div>
            <div className="text-xs opacity-80 tracking-wide">
              QUANTUM NEURAL NETWORK - SECURE CONNECTION ESTABLISHED
            </div>
          </div>

          {/* Main Title */}
          <div className="mb-12">
            <h1 
              className="font-mono text-6xl md:text-8xl font-bold text-green-400 mb-4 tracking-widest animate-pulse"
              style={{ textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00' }}
            >
              PIXELVAULT
            </h1>
            <div 
              className="font-mono text-xl text-green-300 tracking-widest"
              style={{ textShadow: '0 0 10px #00ff00' }}
            >
              BLOCKCHAIN REALITY INTERFACE
            </div>
          </div>

          {/* System Status */}
          <div className="font-mono text-sm mb-12 space-y-2">
            <div className="flex justify-center items-center">
              <span className="text-green-300 mr-4 tracking-wide">NETWORK STATUS:</span>
              <span 
                className="text-green-400 font-bold animate-pulse"
                style={{ textShadow: '0 0 10px #00ff00' }}
              >
                ONLINE
              </span>
            </div>
            <div className="flex justify-center items-center">
              <span className="text-green-300 mr-4 tracking-wide">SECURITY LEVEL:</span>
              <span 
                className="text-green-400 font-bold"
                style={{ textShadow: '0 0 10px #00ff00' }}
              >
                MAXIMUM
              </span>
            </div>
            <div className="flex justify-center items-center">
              <span className="text-green-300 mr-4 tracking-wide">QUANTUM ENCRYPTION:</span>
              <span 
                className="text-green-400 font-bold animate-pulse"
                style={{ textShadow: '0 0 10px #00ff00' }}
              >
                ACTIVE
              </span>
            </div>
          </div>

          {/* Enter Reality Button */}
          <div className="mb-12">
            <Button 
              className="bg-gradient-to-r from-green-900 to-green-800 border-2 border-green-400 text-green-400 font-mono text-lg font-bold tracking-widest px-12 py-6 relative overflow-hidden transition-all duration-300 hover:scale-105 group"
              onClick={handleEnterReality}
              size="lg"
              style={{ 
                textShadow: '0 0 10px #00ff00',
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)'
              }}
            >
              <span className="relative z-10">ENTER REALITY</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </div>

          {/* Footer */}
          <div className="font-mono text-xs space-y-2">
            <div 
              className="text-orange-400 animate-pulse"
              style={{ textShadow: '0 0 10px #ff6600' }}
            >
              WARNING: UNAUTHORIZED ACCESS DETECTED - NEURAL PATTERNS BEING ANALYZED
            </div>
            <div className="text-green-600 tracking-wide">
              BUILD 2025.06.08 | zkSNARK PROOF-OF-WORK CONSENSUS
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}