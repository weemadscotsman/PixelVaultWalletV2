import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Shield, User, Key, Lock } from "lucide-react";
import { WalletLoginForm } from "@/components/wallet/WalletLoginForm";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col bg-gradient-to-b from-black to-blue-950/30"
    >
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-blue-900/20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-400 mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              PixelVault
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          {/* Login Form */}
          <div className="order-2 md:order-1">
            <WalletLoginForm />
          </div>

          {/* Hero Section */}
          <div className="order-1 md:order-2 text-center md:text-left">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">
                Welcome to PVX Blockchain
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                The privacy-first zkSNARK-secured blockchain platform that puts security and 
                education at the forefront of your crypto experience.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-900/30 p-2 rounded-full">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300">Privacy-First Design</h3>
                    <p className="text-gray-400 text-sm">
                      End-to-end encrypted transactions with zero-knowledge proofs
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-900/30 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300">Interactive Wallet</h3>
                    <p className="text-gray-400 text-sm">
                      Manage assets, stake tokens, and participate in governance
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-900/30 p-2 rounded-full">
                    <Key className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300">Secure Authentication</h3>
                    <p className="text-gray-400 text-sm">
                      Cryptographic authentication protects your digital assets
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-blue-900/20">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PixelVault. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
}