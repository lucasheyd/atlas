"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { ethers } from 'ethers';
import { 
  CreditCard, 
  Layers, 
  Moon, 
  Palette, 
  Settings,
  Wallet,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  Sparkles,
  Gamepad2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send('eth_requestAccounts', []);
        
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this feature.');
    }
  };

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkConnection();
    
    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
      }
    };
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/img/logo.svg"
            width="32"
            alt="Nebula Flow Logo"
            height="32"
            className="w-8"
          />
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            Nebula Flow
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Wallet Connection Button/Status */}
          {account ? (
            <div className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-emerald-300 border border-green-200 dark:border-green-800/30 shadow-sm">
              <CheckCircle size={16} className="mr-2 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          ) : (
            <Button 
              size="sm"
              onClick={connectWallet}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md border-0 px-4 py-2 rounded-xl"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={14} className="mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}

          {/* Navigation Dropdown - Redesigned */}
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 border border-indigo-200 dark:border-indigo-800/30 shadow-sm rounded-xl px-4 py-2 flex items-center gap-2"
              >
                <span className="font-medium">Collections</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                {isOpen && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-indigo-100 dark:border-indigo-800/30 shadow-lg rounded-xl p-1 mt-1" align="end">
              <DropdownMenuLabel className="text-indigo-600 dark:text-indigo-400 font-medium px-3 py-2 flex items-center">
                <Sparkles size={16} className="mr-2" />
                NFT Collections
              </DropdownMenuLabel>
              <DropdownMenuGroup className="px-1">
                <DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">

                  <Link href="/fractal-swarm" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 text-purple-600 dark:text-purple-400">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Fractal Swarm</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Interactive particles</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
<DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
  <Link href="/maze-puzzle" className="cursor-pointer flex items-center px-3 py-2">
    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mr-3 text-teal-600 dark:text-teal-400">
      <Gamepad2 className="h-4 w-4" />
    </div>
    <div>
      <div className="font-medium text-gray-900 dark:text-white">Maze Puzzle</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">Interactive game</div>
    </div>
  </Link>
</DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <Link href="/fractal-generator" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 text-green-600 dark:text-green-400">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Fractal Tree</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Generative trees</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <Link href="/lunar-update" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Lunar Chronicles</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Dynamic moon phases</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <Link href="/murmuration" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mr-3 text-pink-600 dark:text-pink-400">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Murmuration 666</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Flocking simulation</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 border-indigo-100 dark:border-indigo-800/30" />

              <DropdownMenuLabel className="text-indigo-600 dark:text-indigo-400 font-medium px-3 py-2 flex items-center">
                <Settings size={16} className="mr-2" />
                Explore
              </DropdownMenuLabel>
              <DropdownMenuGroup className="px-1">
                <DropdownMenuItem asChild className="rounded-lg mb-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <Link href="/gallery" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Gallery</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Browse collections</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <Link href="/bot" className="cursor-pointer flex items-center px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Minting Bot</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Automated tools</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;