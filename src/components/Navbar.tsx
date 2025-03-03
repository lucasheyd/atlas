"use client";
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image"
import { Disclosure } from "@headlessui/react";
import { connectWallet, isOnBaseNetwork, switchToBaseNetwork, switchToBeraNetwork } from '@/utils/wallet';

export const Navbar = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [networkColor, setNetworkColor] = useState('bg-gray-600');

  const navigation = [
  { name: "Fractal Swarm", href: "/mint" },
  { name: "Fractal Tree", href: "/fractal-generator" },
  { name: "Murmuration 666", href: "/murmuration" },
  { name: "Gallery", href: "/gallery" },
  { name: "Bot", href: "/bot" }
];

  // Check wallet and network on component mount
  useEffect(() => {
    const checkWalletAndNetwork = async () => {
      try {
        // Check if wallet is already connected
        if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        }

        // Get current network
        await checkCurrentNetwork();
        
        // Add listener for network change
        if (typeof window !== 'undefined' && window.ethereum) {
          window.ethereum.on('chainChanged', () => {
            checkCurrentNetwork();
          });
          
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
              setWalletAddress('');
            } else {
              setWalletAddress(accounts[0]);
            }
          });
        }
      } catch (error) {
        console.error('Network check failed', error);
      }
    };

    checkWalletAndNetwork();
    
    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkCurrentNetwork);
      }
    };
  }, []);

  // Check current network
  const checkCurrentNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Normalize chainId to lowercase for case-insensitive comparison
        const normalizedChainId = chainId.toLowerCase();
        
        // Check for Base network (Mainnet or Sepolia)
        if (normalizedChainId === '0x2105' || normalizedChainId === '0x14a34') {
          setCurrentNetwork('Base');
          setNetworkColor('bg-blue-600');
        } 
        // Check for Bera network (Mainnet or Testnet)
        else if (normalizedChainId === '0x138de' || normalizedChainId === '0x13985') {
          setCurrentNetwork('Bera');
          setNetworkColor('bg-green-600');
        } 
        // Unknown network
        else {
          setCurrentNetwork('Unknown');
          setNetworkColor('bg-gray-600');
        }
        
        console.log('Current network detected:', currentNetwork, 'Chain ID:', chainId);
      } catch (error) {
        console.error('Error checking chain ID', error);
        setCurrentNetwork('Error');
        setNetworkColor('bg-red-600');
      }
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      await checkCurrentNetwork();
    } catch (error) {
      console.error('Wallet connection failed', error);
    }
  };

  // Handle network switch to Base
  const handleSwitchToBase = async () => {
    try {
      await switchToBaseNetwork();
      setTimeout(checkCurrentNetwork, 1000); // Re-check after switch
    } catch (error) {
      console.error('Network switch failed', error);
    }
  };

  // Handle network switch to Bera
  const handleSwitchToBera = async () => {
    try {
      await switchToBeraNetwork();
      setTimeout(checkCurrentNetwork, 1000); // Re-check after switch
    } catch (error) {
      console.error('Network switch failed', error);
    }
  };

  // Render network buttons
  const renderNetworkButtons = () => {
    if (!walletAddress) return null;
    
    return (
      <div className="flex space-x-2">
        <button 
          onClick={handleSwitchToBase}
          className={`px-4 py-1 text-xs text-white rounded-full ${
            currentNetwork === 'Base' 
              ? 'bg-blue-600' 
              : 'bg-gray-600 hover:bg-blue-500'
          }`}
        >
          Base
        </button>
        <button 
          onClick={handleSwitchToBera}
          className={`px-4 py-1 text-xs text-white rounded-full ${
            currentNetwork === 'Bera' 
              ? 'bg-green-600' 
              : 'bg-gray-600 hover:bg-green-500'
          }`}
        >
          Bera
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      <nav className="container relative flex flex-wrap items-center justify-between p-8 mx-auto lg:justify-between xl:px-1">
        {/* Logo  */}
        <Link href="/">
          <span className="flex items-center space-x-2 text-2xl font-medium text-indigo-500 dark:text-gray-100">
            <span>
              <Image
                src="/img/logo.svg"
                width="32"
                alt="Nebula Flow Logo"
                height="32"
                className="w-8"
              />
            </span>
            <span>Nebula Flow</span>
          </span>
        </Link>

        {/* Wallet Connection */}
        <div className="gap-3 nav__item mr-2 lg:flex ml-auto lg:ml-0 lg:order-2">
          <ThemeChanger />
          <div className="hidden lg:flex nav__item flex-col items-end">
            {/* Network Selector Desktop */}
            {walletAddress && (
              <div className="mb-2 flex space-x-2 justify-end">
                {renderNetworkButtons()}
              </div>
            )}
            
            {/* Wallet Connection Button */}
            {!walletAddress ? (
              <button 
                onClick={handleConnectWallet}
                className="px-6 py-2 text-white bg-indigo-600 rounded-md md:ml-5 hover:bg-indigo-700 transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className={`px-6 py-2 text-white ${networkColor} rounded-md md:ml-5`}>
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </div>
            )}
          </div>
        </div>
                
        <Disclosure>
          {({ open }) => (
            <div className="flex flex-wrap items-center justify-between w-full lg:w-auto">
              <Disclosure.Button
                aria-label="Toggle Menu"
                className="px-2 py-1 text-gray-500 rounded-md lg:hidden hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:text-gray-300 dark:focus:bg-trueGray-700"
              >
                <svg
                  className="w-6 h-6 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  {open ? (
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                    />
                  )}
                </svg>
              </Disclosure.Button>

              <Disclosure.Panel className="flex flex-col w-full my-5 lg:hidden">
                <div className="flex flex-col w-full my-5 lg:hidden">
                  {navigation.map((item) => (
                    <Link 
                      key={item.name} 
                      href={item.href} 
                      className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none"
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Network Selector Mobile */}
                  {walletAddress && (
                    <div className="flex justify-center space-x-2 mt-3">
                      {renderNetworkButtons()}
                    </div>
                  )}
                  
                  <div className="w-full mt-3">
                    {!walletAddress ? (
                      <button 
                        onClick={handleConnectWallet}
                        className="w-full px-6 py-2 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    ) : (
                      <div className={`w-full px-6 py-2 text-center text-white ${networkColor} rounded-md`}>
                        {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      </div>
                    )}
                  </div>
                </div>
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
        
        {/* Main menu */}
        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
            {navigation.map((menu) => (
              <li className="mr-3 nav__item" key={menu.name}>
                <Link 
                  href={menu.href} 
                  className="inline-block px-4 py-2 text-lg font-normal text-gray-800 no-underline rounded-md dark:text-gray-200 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-gray-800"
                >
                  {menu.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;