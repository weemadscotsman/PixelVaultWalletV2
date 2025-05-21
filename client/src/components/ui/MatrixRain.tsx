import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number; // Allows controlling the opacity of the effect
  density?: number; // Controls the density of the falling characters
  speed?: number; // Controls the speed of the falling characters
  kanji?: boolean; // Whether to use kanji or Latin characters
  zIndex?: number; // Controls the z-index of the canvas
}

export function MatrixRain({
  opacity = 0.1,
  density = 1,
  speed = 1,
  kanji = true,
  zIndex = -1
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Character set - either Latin or Kanji
    const charSet = kanji
      ? 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890日月火水木金土あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Matrix rain implementation
    const columns = Math.floor(canvas.width / 20 * density);
    const drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -canvas.height;
    }

    const draw = () => {
      // Set semi-transparent black background for the fade effect
      ctx.fillStyle = `rgba(0, 0, 0, ${0.05 * speed})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text color and style
      ctx.fillStyle = `rgba(0, 255, 70, ${opacity + 0.2})`; // Brighter Matrix green with increased opacity
      ctx.font = '16px monospace';

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Choose a random character
        const text = charSet[Math.floor(Math.random() * charSet.length)];
        
        // Draw the character
        const x = i * 20;
        const y = drops[i];
        
        // Create a subtle glow effect for some characters
        if (Math.random() > 0.8) {
          ctx.shadowColor = "rgba(0, 255, 70, 0.8)";
          ctx.shadowBlur = 10;
          ctx.fillText(text, x, y);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(text, x, y);
        }

        // Reset drop to top if it reaches the bottom or randomly
        if (y > canvas.height || Math.random() > 0.99) {
          drops[i] = 0;
        }

        // Move drop down
        drops[i] += 10 * speed;
      }
    };

    // Animation loop
    const interval = setInterval(draw, 33); // ~30fps

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [opacity, density, speed, kanji]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex }}
    />
  );
}