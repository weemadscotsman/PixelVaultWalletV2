import { useState, useEffect } from 'react';

type Theme = 'dark' | 'cyberpunk';

// Add CSS to document head to ensure styles are loaded before React
function injectGlobalStyles() {
  const styleId = 'pvx-theme-globals';
  
  // Only add if not already present
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      :root {
        --primary-color: #4ade80;
        --secondary-color: #10b981;
        --accent-color: #00ffaa;
        --background-color: #0a0a0a;
        --terminal-glow: 0 0 10px #00ff00, 0 0 20px rgba(0, 255, 0, 0.5);
      }
      
      /* Specific theme overrides */
      .dark-theme {
        --primary-color: #4ade80;
        --secondary-color: #10b981;
        --accent-color: #00ffaa;
        --background-color: #0a0a0a;
        --terminal-glow: 0 0 10px #00ff00, 0 0 20px rgba(0, 255, 0, 0.5);
      }
      
      .cyberpunk-theme {
        --primary-color: #ff00ff;
        --secondary-color: #00ffff;
        --accent-color: #ffff00;
        --background-color: #0a0a16;
        --terminal-glow: 0 0 10px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.5);
      }
      
      /* Apply effects to neon elements */
      .neon {
        text-shadow: var(--terminal-glow);
      }
      
      /* Apply styling to scrollbars */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #151515;
      }
      
      ::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-color);
      }
    `;
    document.head.appendChild(styleEl);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Inject global styles once
  useEffect(() => {
    injectGlobalStyles();
  }, []);
  
  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pvx-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Set default theme if none exists
      applyTheme('dark');
    }
  }, []);
  
  // Apply theme styles to document
  const applyTheme = (newTheme: Theme) => {
    // Always remove both themes first
    document.documentElement.classList.remove('dark-theme', 'cyberpunk-theme');
    
    // Then add the selected theme
    document.documentElement.classList.add(`${newTheme}-theme`);
    
    // Access and update all themed elements
    document.querySelectorAll('.neon').forEach(el => {
      // Force re-render of shadow effect
      el.classList.remove('neon');
      // Trigger reflow (type assertion to HTMLElement which has offsetWidth)
      void (el as HTMLElement).offsetWidth;
      el.classList.add('neon');
    });
    
    // Save to localStorage
    localStorage.setItem('pvx-theme', newTheme);
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'cyberpunk' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className={`relative w-12 h-6 rounded-full p-1 transition-colors ${
          theme === 'dark' ? 'bg-green-800' : 'bg-purple-800'
        }`}
        aria-label={`Switch to ${theme === 'dark' ? 'cyberpunk' : 'dark'} mode`}
      >
        <span
          className={`block w-4 h-4 rounded-full transition-transform transform ${
            theme === 'dark' ? 'bg-green-400 translate-x-0' : 'bg-fuchsia-400 translate-x-6'
          }`}
        />
      </button>
      
      {/* Visual indicator (shown on hover) */}
      <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-[-24px] left-[50%] transform translate-x-[-50%] text-xs font-semibold text-gray-300 bg-black bg-opacity-80 px-2 py-1 rounded whitespace-nowrap">
        {theme === 'dark' ? 'Matrix Mode' : 'Cyberpunk'}
      </span>
    </div>
  );
}