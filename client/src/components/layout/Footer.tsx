export function Footer() {
  return (
    <footer className="bg-black border-t border-blue-900/50 py-4 px-4 md:px-6 transition-colors duration-200 z-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <i className="ri-shield-keyhole-fill text-cyan-500 mr-2 text-lg"></i>
          <span className="text-white font-medium text-shadow-blue">PixelVault Blockchain</span>
          <span className="text-xs ml-2 px-2 py-0.5 bg-blue-900/30 rounded-full text-cyan-300 font-medium border border-blue-800/50">v1.0.0</span>
        </div>
        <div className="text-sm text-cyan-400">
          <div className="flex space-x-6">
            <a href="#" className="hover:text-cyan-300 transition-colors duration-200 flex items-center">
              <i className="fas fa-book mr-1"></i>
              <span>Docs</span>
            </a>
            <a href="#" className="hover:text-cyan-300 transition-colors duration-200 flex items-center">
              <i className="fab fa-github mr-1"></i>
              <span>GitHub</span>
            </a>
            <a href="#" className="hover:text-cyan-300 transition-colors duration-200 flex items-center">
              <i className="fab fa-discord mr-1"></i>
              <span>Discord</span>
            </a>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-3 pt-3 border-t border-blue-900/30 text-xs text-center text-cyan-300/80">
        <p>Built with privacy and security in mind. PVX uses zkSNARK technology for maximum privacy.</p>
      </div>
    </footer>
  );
}
