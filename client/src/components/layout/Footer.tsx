export function Footer() {
  return (
    <footer className="bg-sidebar border-t border-gray-700 py-4 px-4 md:px-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <i className="ri-shield-keyhole-fill text-primary mr-2 text-lg"></i>
          <span className="text-white">PixelVault Blockchain</span>
          <span className="text-xs ml-2 px-2 py-0.5 bg-background rounded-full text-gray-400">v0.1.0-alpha</span>
        </div>
        <div className="text-sm text-gray-400">
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition">Documentation</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
