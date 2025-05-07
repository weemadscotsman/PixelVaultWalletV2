export function Footer() {
  return (
    <footer className="bg-white dark:bg-dark-card border-t border-light-border dark:border-dark-border py-4 px-4 md:px-6 transition-colors duration-200">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <i className="ri-shield-keyhole-fill text-primary mr-2 text-lg"></i>
          <span className="text-gray-800 dark:text-white font-medium">PixelVault Blockchain</span>
          <span className="text-xs ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 font-medium">v1.0.0</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex space-x-6">
            <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center">
              <i className="fas fa-book mr-1"></i>
              <span>Docs</span>
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center">
              <i className="fab fa-github mr-1"></i>
              <span>GitHub</span>
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center">
              <i className="fab fa-discord mr-1"></i>
              <span>Discord</span>
            </a>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-center text-gray-500 dark:text-gray-500">
        <p>Built with privacy and security in mind. PVX uses zkSNARK technology for maximum privacy.</p>
      </div>
    </footer>
  );
}
