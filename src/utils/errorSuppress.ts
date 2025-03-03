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
        
        // Web3 errors
        'TypeError: (0 , *****utils*****',
        '[ethjs-query]',
        
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
        './src/app/layout.tsx'
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
        'Warning: Each child in a list'
      ];
      
      const shouldSuppress = warningsToSuppress.some(pattern => {
        if (typeof args[0] === 'string') {
          return args[0].includes(pattern);
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