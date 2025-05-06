import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  term: string;
  children: React.ReactNode;
  width?: 'narrow' | 'medium' | 'wide';
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlightStyle?: 'dotted' | 'underline' | 'glow' | 'none';
}

// Glossary of blockchain and crypto terms
const cryptoGlossary: Record<string, string> = {
  // Blockchain Basics
  "blockchain": "A distributed digital ledger with a growing list of records (blocks) that are securely linked together using cryptography.",
  "block": "A container data structure that contains a set of transactions and metadata, including a reference to the previous block in the chain.",
  "node": "A computer that participates in a blockchain network by maintaining a copy of the blockchain and validating transactions.",
  "consensus": "The process by which all participants in a blockchain network agree on the state of the ledger.",
  "distributed ledger": "A database that is consensually shared and synchronized across multiple sites, institutions, or geographies.",
  "hash": "A fixed-length string of characters generated from an input of arbitrary length using a cryptographic hash function.",
  "immutable": "Cannot be changed; in blockchain, once data has been recorded, it cannot be altered retroactively.",

  // Crypto Concepts
  "cryptocurrency": "A digital or virtual currency that uses cryptography for security and operates on a blockchain.",
  "wallet": "A digital tool that allows users to store and manage their cryptocurrencies, containing private keys for access.",
  "private key": "A secure digital code that allows access to one's cryptocurrency holdings, functioning like a password.",
  "public key": "A cryptographic key that can be shared with anyone, derived from a private key and used to verify transactions.",
  "address": "A unique identifier that serves as a location where cryptocurrency can be sent to or from.",
  "mining": "The process of validating and adding transaction records to a blockchain, often rewarded with new coins.",
  "gas fee": "A fee paid to miners or validators to process transactions on a blockchain network.",
  "token": "A unit of value issued by a tech platform, company, or group, representing an asset or utility.",
  "smart contract": "Self-executing contracts with the terms directly written into code, automatically enforcing obligations.",

  // Privacy & Security
  "zkSNARK": "Zero-Knowledge Succinct Non-interactive Argument of Knowledge; a form of cryptographic proof that maintains privacy.",
  "zero-knowledge proof": "A method by which one party can prove to another that a statement is true without revealing any additional information.",
  "encryption": "The process of encoding information so that only authorized parties can access it.",
  "cold storage": "Keeping cryptocurrency offline to protect it from hacking, often using hardware wallets.",
  "hot wallet": "A cryptocurrency wallet that's connected to the internet for regular transactions.",
  "seed phrase": "A series of words (usually 12-24) that serve as a backup to recover wallet access.",
  "multi-sig": "Requiring multiple parties to sign a transaction before it can be executed.",

  // Trading & DeFi
  "DEX": "Decentralized Exchange; a crypto exchange that operates without a central authority.",
  "AMM": "Automated Market Maker; a protocol that uses liquidity pools instead of traditional order books.",
  "liquidity pool": "A collection of funds locked in a smart contract to facilitate decentralized trading and lending.",
  "yield farming": "The practice of staking or lending crypto assets to generate returns or rewards.",
  "staking": "Participating in transaction validation on a proof-of-stake blockchain by locking up tokens.",
  "governance token": "A token that gives holders voting rights on proposed changes to a protocol.",
  "impermanent loss": "The temporary loss of funds occasionally experienced by liquidity providers due to price volatility.",

  // PVX Specific
  "PVX": "The native token of the PIXELVAULT blockchain ecosystem with 6 decimal places precision.",
  "µPVX": "Micro-PVX, the smallest unit of PVX equal to 0.000001 PVX.",
  "veto guardian": "A special account with limited powers to veto dangerous governance proposals in the PIXELVAULT ecosystem.",
  "Thringlet": "A special type of encrypted collectible in the PIXELVAULT ecosystem with unique properties.",
  "PIXELVAULT": "A privacy-first zkSNARK-secured blockchain platform focused on secure digital ownership."
};

export function Tooltip({ term, children, width = 'medium', position = 'top', highlightStyle = 'dotted' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLSpanElement>(null);
  
  // Normalize term for lookup
  const normalizedTerm = term.toLowerCase();
  // Get definition from glossary or use a default message
  const definition = cryptoGlossary[normalizedTerm] || 
    "No definition available for this term. Our glossary is continuously being updated.";
  
  // Position the tooltip based on the reference element
  useEffect(() => {
    if (isVisible && tooltipRef.current && termRef.current) {
      const termRect = termRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = termRect.top + scrollTop - tooltipRect.height - 8;
          left = termRect.left + scrollLeft + (termRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = termRect.bottom + scrollTop + 8;
          left = termRect.left + scrollLeft + (termRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = termRect.top + scrollTop + (termRect.height / 2) - (tooltipRect.height / 2);
          left = termRect.left + scrollLeft - tooltipRect.width - 8;
          break;
        case 'right':
          top = termRect.top + scrollTop + (termRect.height / 2) - (tooltipRect.height / 2);
          left = termRect.right + scrollLeft + 8;
          break;
      }
      
      // Adjust to ensure tooltip is within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 10) left = 10;
      if (left + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - tooltipRect.width - 10;
      }
      
      if (top < 10) top = 10;
      if (top + tooltipRect.height > viewportHeight + scrollTop - 10) {
        top = viewportHeight + scrollTop - tooltipRect.height - 10;
      }
      
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [isVisible, position]);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        termRef.current &&
        !termRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Set width class based on prop
  const widthClass = {
    narrow: 'max-w-xs',
    medium: 'max-w-sm',
    wide: 'max-w-md'
  }[width];
  
  // Set highlight style
  const termStyle = {
    dotted: 'border-b border-dotted border-green-400 hover:text-green-400',
    underline: 'border-b hover:text-green-400',
    glow: 'hover:text-green-400 hover:drop-shadow-[0_0_2px_#4ade80]',
    none: ''
  }[highlightStyle];
  
  return (
    <>
      <span 
        ref={termRef}
        className={`inline-block cursor-help ${termStyle}`}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </span>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`fixed ${widthClass} z-50 p-3 rounded-md bg-black bg-opacity-90 border border-green-500 text-white text-sm shadow-lg`}
          style={{ boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)' }}
        >
          <div className="font-bold text-green-400 mb-1">{term}</div>
          <p>{definition}</p>
        </div>
      )}
    </>
  );
}