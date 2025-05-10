import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Grid, Layout, ArrowLeft, Zap, Share2, Shield, Wallet, Droplets, HelpCircle, 
  Gift, Award, Settings, Database, BarChart, UserPlus, Terminal, Warehouse } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ActionsPage() {
  return (
    <PageLayout isConnected={true}>
      <Helmet>
        <title>Quick Actions | PixelVault</title>
        <meta name="description" content="Access all quick actions for the PVX blockchain" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Quick Actions</h1>
            <p className="text-muted-foreground">All available actions in your PVX Wallet</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Wallet Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/wallet#send">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Wallet className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Send μPVX</p>
                <p className="text-xs text-gray-400">Transfer tokens to another wallet</p>
              </div>
            </Link>
            <Link href="/wallet#receive">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Wallet className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Receive μPVX</p>
                <p className="text-xs text-gray-400">Show your wallet address</p>
              </div>
            </Link>
            <Link href="/wallet#security">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Shield className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Security</p>
                <p className="text-xs text-gray-400">Manage wallet security</p>
              </div>
            </Link>
            <Link href="/transactions">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Database className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Transactions</p>
                <p className="text-xs text-gray-400">View all transactions</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Node Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/blockchain#mining">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Mine Blocks</p>
                <p className="text-xs text-gray-400">Earn rewards by mining</p>
              </div>
            </Link>
            <Link href="/blockchain/blocks">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Warehouse className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">View Blocks</p>
                <p className="text-xs text-gray-400">Explore the blockchain</p>
              </div>
            </Link>
            <Link href="/blockchain#validation">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Validate</p>
                <p className="text-xs text-gray-400">Validate blockchain security</p>
              </div>
            </Link>
            <Link href="/terminal">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Terminal className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Terminal</p>
                <p className="text-xs text-gray-400">Access advanced features</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Staking & Governance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/staking">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Share2 className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Stake Tokens</p>
                <p className="text-xs text-gray-400">Earn passive rewards</p>
              </div>
            </Link>
            <Link href="/governance">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Layout className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Governance</p>
                <p className="text-xs text-gray-400">Vote on proposals</p>
              </div>
            </Link>
            <Link href="/staking#stats">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <BarChart className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Stats</p>
                <p className="text-xs text-gray-400">View staking statistics</p>
              </div>
            </Link>
            <Link href="/utr">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <UserPlus className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">UTR Portal</p>
                <p className="text-xs text-gray-400">Manage node membership</p>
              </div>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            Rewards & Learning
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/drops">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Droplets className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Secret Drops</p>
                <p className="text-xs text-gray-400">Claim special rewards</p>
              </div>
            </Link>
            <Link href="/badges">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Award className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Badges</p>
                <p className="text-xs text-gray-400">View your achievements</p>
              </div>
            </Link>
            <Link href="/learning">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <HelpCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Learning</p>
                <p className="text-xs text-gray-400">Learn blockchain basics</p>
              </div>
            </Link>
            <Link href="/settings">
              <div className="bg-black/70 border border-blue-900/50 rounded-lg p-6 text-center hover:bg-blue-900/20 transition-colors">
                <Settings className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-base text-blue-300 font-medium mb-1">Settings</p>
                <p className="text-xs text-gray-400">Configure your preferences</p>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
}