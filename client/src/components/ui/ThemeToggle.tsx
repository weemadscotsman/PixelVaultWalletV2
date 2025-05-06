import { useState, useEffect } from 'react';

type Theme = 'dark' | 'cyberpunk';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pvx-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);
  
  // Apply theme styles to document
  const applyTheme = (newTheme: Theme) => {
    // Always remove both themes first
    document.documentElement.classList.remove('dark-theme', 'cyberpunk-theme');
    
    // Then add the selected theme
    document.documentElement.classList.add(`${newTheme}-theme`);
    
    // Update CSS variables for the specific theme
    if (newTheme === 'cyberpunk') {
      document.documentElement.style.setProperty('--primary-color', '#ff00ff');
      document.documentElement.style.setProperty('--secondary-color', '#00ffff');
      document.documentElement.style.setProperty('--accent-color', '#ffff00');
      document.documentElement.style.setProperty('--background-color', '#0a0a16');
      document.documentElement.style.setProperty('--terminal-glow', '0 0 10px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.5)');
    } else {
      // Dark theme (default)
      document.documentElement.style.setProperty('--primary-color', '#4ade80');
      document.documentElement.style.setProperty('--secondary-color', '#10b981');
      document.documentElement.style.setProperty('--accent-color', '#00ffaa');
      document.documentElement.style.setProperty('--background-color', '#0a0a0a');
      document.documentElement.style.setProperty('--terminal-glow', '0 0 10px #00ff00, 0 0 20px rgba(0, 255, 0, 0.5)');
    }
    
    // Save to localStorage
    localStorage.setItem('pvx-theme', newTheme);
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'cyberpunk' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  return (
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
      
      {/* Visual indicator */}
      <span className="absolute top-[-24px] left-[50%] transform translate-x-[-50%] text-xs font-semibold text-gray-300 bg-black bg-opacity-80 px-2 py-1 rounded whitespace-nowrap">
        {theme === 'dark' ? 'Matrix Mode' : 'Cyberpunk'}
      </span>
    </button>
  );
}