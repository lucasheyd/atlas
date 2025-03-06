export function suppressConsoleErrors() {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    
    // Store original for potential restoration
    if (!window['originalConsoleError']) {
      window['originalConsoleError'] = originalError;
    }
    
    console.error = function(...args: any[]) {
      // Skip error if any of these patterns match
      const errorsToSuppress = [
        // Headless UI errors
        'Invalid prop `data-headlessui-state` supplied to `React.Fragment`',
        
        // Next.js hydration errors
        'Warning: Text content did not match',
        'Warning: Prop `style` did not match',
        'Warning: Expected server HTML to contain a matching',
        'Error: Hydration failed because the initial UI does not match',
        'Text content does not match server-rendered HTML',
        'Hydration failed because',
        
        // Server Component errors
        'Only plain objects can be passed to Client Components from Server Components',
        'Set objects are not supported',
        'Only plain objects',
        '{P: </>, b: ..., p: "", c:',
        
        // React version mismatch errors
        'Warning: Invalid hook call',
        
        // Network errors
        'Failed to fetch',
        'Network request failed',
        'network changed',
        'underlying network changed',
        'execution reverted',
        'missing revert data',
        'CALL_EXCEPTION',
        
        // MetaMask/Wallet errors
        'MetaMask - RPC Error',
        'Non-Error promise rejection captured',
        
        // Web3 errors (Expandido)
        'TypeError: (0 , *****utils*****',
        '[ethjs-query]',
        'Nonce too high',
        'Invalid JSON RPC response',
        'Transaction underpriced',
        'Transaction was rejected',
        'insufficient funds',
        'Insufficient funds',
        'gas required exceeds allowance',
        'intrinsic gas too low',
        'replacement transaction underpriced',
        'transaction pool full',
        'already known',
        'Transaction with the same hash was already imported',
        'Error: [object Object]', // Comum em erros de web3
        'Error: Internal JSON-RPC error',
        'RPC Error',
        'User denied transaction signature',
        'User rejected the request',
        'Error: Error: ',  // Padrão de erro duplicado comum no web3
        'Provider not set or invalid',
        'Invalid response - empty',
        'Invalid JSON RPC response: ""',
        'connection not open',
        'connection error',
        'blockchain not supported',
        'blockchain unsupported',
        'Please pass numbers as strings or BN objects',
        'Provider error',
        'Chain ID changed',
        'ENS name not configured',
        'contract not deployed',
        'Error: Number can only safely store up to 53 bits', // Erro comum ao trabalhar com valores grandes como gas
        'is not a valid Ethereum address',
        'MetaMask - ',
        'wallet_',
        'eth_',
        'net_',
        'web3_',
        'WalletConnect',
        'Wallet Connect',
        'CoinbaseWallet',
        'Coinbase Wallet',
        'Infura',
        'Alchemy',
        'could not detect network',
        'Invalid chain id',
        
        // React state errors
        'Cannot update a component',
        'Maximum update depth exceeded',
        
        // Common 3rd party library errors
        'ResizeObserver loop',
        'ResizeObserver loop completed with undelivered notifications',
        'ResizeObserver loop limit exceeded',
        
        // Tailwind and styling errors
        'Invalid CSS property',
        'Received `true` for a non-boolean attribute',
        
        // Generic errors to potentially suppress (use with caution)
        'The above error occurred in the',
        'Consider adding an error boundary'
      ];
      
      // Skip errors that reference specific files
      const filesToSuppress = [
        'src/app/layout.tsx',
        './src/app/layout.tsx',
        'node_modules/web3',
        'node_modules/@web3',
        'node_modules/ethers',
        'node_modules/@ethersproject',
        'node_modules/@walletconnect',
        'node_modules/@coinbase'
      ];
      
      // Special handling for Set object error which has a specific structure
      let isSetObjectError = false;
      if (args.length > 0) {
        // Check if it's the Set object error
        if (typeof args[0] === 'string' && args[0].includes('Server Components')) {
          isSetObjectError = true;
        }
        
        // Check if any arg references a file path we want to suppress
        const stringArgs = args.filter(arg => typeof arg === 'string');
        if (stringArgs.some(arg => filesToSuppress.some(file => arg.includes(file)))) {
          return; // Suppress completely
        }
      }
      
      // Check if any of the patterns match the error message
      const shouldSuppress = isSetObjectError || errorsToSuppress.some(pattern => {
        // Handle both string and error object cases
        if (typeof args[0] === 'string') {
          return args[0].includes(pattern);
        } else if (args[0] instanceof Error) {
          return args[0].message.includes(pattern);
        } else if (args[0] && typeof args[0] === 'object') {
          // Try to stringify the object and check
          try {
            const str = JSON.stringify(args[0]);
            return str.includes(pattern);
          } catch (e) {
            // If we can't stringify, try to use toString()
            return String(args[0]).includes(pattern);
          }
        }
        return false;
      });
      
      // Log to console only if we shouldn't suppress
      if (!shouldSuppress) {
        return originalError.call(console, ...args);
      }
    };
    
    // Optionally suppress warnings too
    const originalWarn = console.warn;
    if (!window['originalConsoleWarn']) {
      window['originalConsoleWarn'] = originalWarn;
    }
    
    console.warn = function(...args: any[]) {
      const warningsToSuppress = [
        'Warning: ReactDOM.render',
        'Warning: React.createFactory()',
        'Warning: Using UNSAFE_',
        'Warning: Cannot update during an existing state transition',
        'Warning: Can\'t perform a React state update on an unmounted component',
        'Warning: findDOMNode is deprecated',
        'Warning: componentWill',
        'A component is changing',
        '[Fast Refresh]',
        'Invalid prop `data-headlessui-state` supplied to `React.Fragment`',
        'Warning: Failed prop type',
        'Warning: Each child in a list',
        // Web3 warnings
        'MetaMask:',
        'Please use eth_',
        'is deprecated',
        'is deprecated and will be removed',
        'will be removed in the future',
        'is not recognized',
        'Non-standard',
        'non-standard',
        'Transaction was not mined within',
        'Using web3 detected from window object',
        'Extension context invalid',
        'Please authorize this website'
      ];
      
      const shouldSuppress = warningsToSuppress.some(pattern => {
        if (typeof args[0] === 'string') {
          return args[0].includes(pattern);
        } else if (args[0] instanceof Error) {
          return args[0].message.includes(pattern);
        } else if (args[0] && typeof args[0] === 'object') {
          try {
            const str = JSON.stringify(args[0]);
            return str.includes(pattern);
          } catch (e) {
            return String(args[0]).includes(pattern);
          }
        }
        return false;
      });
      
      if (!shouldSuppress) {
        return originalWarn.call(console, ...args);
      }
    };
  }
}

// Function to restore original console behavior if needed
export function restoreConsole() {
  if (typeof window !== 'undefined') {
    if (window['originalConsoleError']) {
      console.error = window['originalConsoleError'];
    }
    if (window['originalConsoleWarn']) {
      console.warn = window['originalConsoleWarn'];
    }
  }
}

// Utility function to suppress specific web3 errors
export function suppressWeb3Errors() {
  // Create a global error event handler
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(event) {
      const web3ErrorPatterns = [
        'MetaMask',
        'wallet',
        'ethereum',
        'web3',
        'RPC',
        'blockchain',
        'transaction',
        'contract',
        'network',
        'chain',
        'gas',
        'block',
        'ether'
      ];
      
      // Check if the error message contains any web3-related keywords
      const isWeb3Error = web3ErrorPatterns.some(pattern => 
        event.message && event.message.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isWeb3Error) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      return true;
    }, true);
    
    // Handle unhandled promise rejections (common with web3)
    window.addEventListener('unhandledrejection', function(event) {
      const web3ErrorPatterns = [
        'MetaMask',
        'wallet',
        'ethereum',
        'web3',
        'RPC',
        'blockchain',
        'transaction',
        'contract',
        'network',
        'chain',
        'gas',
        'block',
        'ether'
      ];
      
      let errorMessage = '';
      
      if (event.reason) {
        if (typeof event.reason === 'string') {
          errorMessage = event.reason;
        } else if (event.reason.message) {
          errorMessage = event.reason.message;
        } else {
          try {
            errorMessage = JSON.stringify(event.reason);
          } catch (e) {
            errorMessage = String(event.reason);
          }
        }
      }
      
      const isWeb3Error = web3ErrorPatterns.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isWeb3Error) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      return true;
    }, true);
  }
}