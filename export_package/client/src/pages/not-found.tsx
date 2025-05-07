import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="matrix-background"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-black/90 border-red-900/50 p-6 w-full max-w-md mx-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-950/10 z-0"></div>
          
          {/* Error effect */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-0 animate-error-pulse"
            style={{ 
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
            }}
          />
          
          <CardContent className="relative z-10 pt-6">
            <div className="flex items-center mb-6 gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-shadow-neon-red">404 ERROR</h1>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-md border border-red-900/50 mb-6">
              <div className="font-mono terminal-text">
                <div className="text-red-400">[ SYSTEM ALERT ]</div>
                <div className="text-gray-300 mt-2">Connection failed to PVX blockchain node.</div>
                <div className="text-gray-300">The requested path does not exist in the network.</div>
                <div className="mt-3 flex items-center">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-red-400 ml-2">DISCONNECTED</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                className="border-red-900/50 text-red-400 hover:bg-red-950/30"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-500">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
