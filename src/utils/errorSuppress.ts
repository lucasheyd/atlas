export function suppressConsoleErrors() {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = function(...args: any[]) {
      if (
        args[0]?.includes?.('Invalid prop `data-headlessui-state` supplied to `React.Fragment`')
      ) {
        return;
      }
      return originalError.call(console, ...args);
    };
  }
}