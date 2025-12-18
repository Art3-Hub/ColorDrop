#!/bin/bash
# Clean dev start script - fixes NODE_ENV and standalone config issues

cd "$(dirname "$0")"

# Unset conflicting environment variables
unset NODE_ENV
unset __NEXT_PRIVATE_STANDALONE_CONFIG
unset __NEXT_PRIVATE_ORIGIN
unset NEXT_DEPLOYMENT_ID
unset NEXT_OTEL_FETCH_DISABLED

# Use Node 20 if nvm is available
if [ -f ~/.nvm/nvm.sh ]; then
  source ~/.nvm/nvm.sh
  nvm use 20 2>/dev/null || true
fi

# Clean cache if --clean flag passed
if [ "$1" = "--clean" ]; then
  echo "Cleaning .next cache..."
  rm -rf .next
fi

# Start dev server
npm run dev
