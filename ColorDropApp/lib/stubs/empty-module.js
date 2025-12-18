// Stub module for unused dependencies
// This is used to stub out Solana/Base dependencies that are pulled in by wagmi connectors
// but not needed for this Celo-only app

// Create a proxy that returns empty objects/functions for any property access
const handler = {
  get: function(target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return target;
    // Return a function that does nothing and returns undefined
    return function() { return undefined; };
  },
  apply: function() {
    return undefined;
  }
};

const stub = new Proxy(function() {}, handler);

module.exports = stub;
module.exports.default = stub;
module.exports.generate = function() { return undefined; };
