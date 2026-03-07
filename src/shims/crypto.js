// Shim for Node.js 'crypto' module in browser environment
export const randomBytes = (size) => {
  const bytes = new Uint8Array(size);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
     // Node environment or some polyfill
     global.crypto.getRandomValues(bytes);
  } else {
    // Fallback for very old environments (not secure but works for basic IDs)
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
};

export default {
  randomBytes
};
