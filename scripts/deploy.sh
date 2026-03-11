#!/bin/bash
# scripts/deploy.sh
# A script to ensure a clean state before deploying from the local source.

echo "🚀 Starting Deployment Sequence..."

# 1. Clean up any local build artifacts
echo "🧹 Cleaning local cache..."
rm -rf .next
rm -rf out

# 2. Build the project
echo "🏗️ Building the project..."
npm run build

# 3. Deploy from local source
echo "📤 Deploying from local source..."
firebase deploy --only apphosting:studio

echo "✅ Sequence complete. Monitor the deployment in the Firebase Console."
