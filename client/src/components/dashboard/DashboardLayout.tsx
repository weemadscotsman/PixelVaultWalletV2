import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutGrid,
  Wallet,
  Blocks,
  Share2,
  Award,
  Heart,
  TerminalSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
  BookOpen,
  UserCircle,
  Cpu,
  Medal,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  pageNumber?: number;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const mainNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5" />,
      path: '/',
      pageNumber: 3
    },
    {
      name: 'Wallet',
      icon: <Wallet className="w-5 h-5" />,
      path: '/wallet',
      pageNumber: 3
    },
    {
      name: 'Blockchain',
      icon: <Blocks className="w-5 h-5" />,
      path: '/blockchain',
      pageNumber: 3
    },
    {
      name: 'UTR Explorer',
      icon: <Database className="w-5 h-5" />,
      path: '/utr',
      pageNumber: 3
    },
    {
      name: 'Staking',
      icon: <Share2 className="w-5 h-5" />,
      path: '/staking',
      pageNumber: 3
    },
    {
      name: 'Governance',
      icon: <Award className="w-5 h-5" />,
      path: '/governance',
      pageNumber: 3
    },
    {
      name: 'Badges',
      icon: <Medal className="w-5 h-5" />,
      path: '/badges',
      badge: 5,
      pageNumber: 3
    },
    {
      name: 'Thringlets',
      icon: <Heart className="w-5 h-5" />,
      path: '/thringlets',
      badge: 3,
      pageNumber: 5
    },
    {
      name: 'Secret Drops',
      icon: <Droplets className="w-5 h-5" />,
      path: '/drops',
      badge: 2,
      pageNumber: 3
    },
    {
      name: 'Learning Lab',
      icon: <BookOpen className="w-5 h-5" />,
      path: '/learning',
      pageNumber: 3
    },
  ];
  
  const secondaryNavItems: NavItem[] = [
    {
      name: 'Terminal',
      icon: <TerminalSquare className="w-5 h-5" />,
      path: '/terminal',
      pageNumber: 4
    },
    {
      name: 'User Profile',
      icon: <UserCircle className="w-5 h-5" />,
      path: '/profile',
      pageNumber: 3
    },
    {
      name: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/settings',
      pageNumber: 3
    },
  ];
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <motion.div 
        className="h-full bg-black border-r border-blue-900/40 relative z-50"
        style={{ pointerEvents: 'all', touchAction: 'auto' }}
        initial={{ width: 240 }}
        animate={{ width: sidebarCollapsed ? 80 : 240 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-blue-900/40">
            <div className="flex items-center">
              <Cpu className="w-8 h-8 text-blue-400" />
              {!sidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-2 font-bold text-xl text-blue-400"
                >
                  PVX Vault
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {mainNavItems.map((item) => (
              <div key={item.path}>
                <Link href={item.path}>
                  <div className={cn(
                    "flex items-center px-4 py-3 text-gray-300 hover:bg-blue-900/20 cursor-pointer transition-colors group",
                    location === item.path && "bg-blue-900/30 text-blue-300 border-l-4 border-blue-400 pl-3"
                  )}>
                    <div className="relative">
                      <span className={cn(
                        "absolute -left-2 -top-2 text-[10px] w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full",
                        (!item.badge || sidebarCollapsed) && "hidden"
                      )}>
                        {item.badge}
                      </span>
                      {item.icon}
                    </div>
                    
                    {!sidebarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-3 flex-1"
                      >
                        {item.name}
                      </motion.span>
                    )}
                    
                    {!sidebarCollapsed && item.pageNumber && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400"
                      >
                        P{item.pageNumber}
                      </motion.div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          {/* Secondary Navigation */}
          <div className="py-4 border-t border-blue-900/40 space-y-1">
            {secondaryNavItems.map((item) => (
              <div key={item.path}>
                <Link href={item.path}>
                  <div className={cn(
                    "flex items-center px-4 py-3 text-gray-400 hover:bg-blue-900/20 cursor-pointer transition-colors",
                    location === item.path && "bg-blue-900/30 text-blue-300 border-l-4 border-blue-400 pl-3"
                  )}>
                    <div>{item.icon}</div>
                    
                    {!sidebarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-3"
                      >
                        {item.name}
                      </motion.span>
                    )}
                    
                    {!sidebarCollapsed && item.pageNumber && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-auto w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400"
                      >
                        P{item.pageNumber}
                      </motion.div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
            
            {/* Collapse Button */}
            <button 
              onClick={toggleSidebar}
              className="flex items-center w-full px-4 py-3 text-gray-400 hover:bg-blue-900/20 cursor-pointer transition-colors"
            >
              <div>
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </div>
              
              {!sidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3"
                >
                  Collapse
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-blue-900/40 flex items-center px-6 bg-black/95 relative z-40" style={{ pointerEvents: 'all', touchAction: 'auto' }}>
          <h1 className="text-xl font-bold text-blue-300">
            {mainNavItems.find(item => item.path === location)?.name || 
             secondaryNavItems.find(item => item.path === location)?.name || 
             'Dashboard'}
          </h1>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-blue-400 bg-blue-950/30 px-3 py-1 rounded-full border border-blue-900/50">
              PAGE 3/6
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-400">Network: Online</span>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-blue-950/20 p-6 relative z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
              style={{ pointerEvents: 'all', touchAction: 'auto' }}
            >
              <div className="relative z-30" style={{ pointerEvents: 'all', touchAction: 'auto' }}>
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}