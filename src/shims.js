if (typeof window !== 'undefined') {
  // Polyfill global crypto for libraries that expect it
  window.crypto = window.crypto || {};
  window.crypto.subtle = window.crypto.subtle || {};
}

export {}; // Make this a module