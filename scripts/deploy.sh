#!/bin/bash
# scripts/deploy.sh
# A script to ensure a clean state before pushing to App Hosting.

echo "🚀 Starting Deployment Sequence..."

# 1. Clean up any local build artifacts
echo "🧹 Cleaning local cache..."
rm -rf .next
rm -rf out

# 2. Ensure all changes are staged
echo "📝 Committing changes..."
git add .
git commit -m "chore: deployment sync and build fix" --allow-empty

# 3. Push to master
echo "📤 Pushing to master..."
git push origin master

# 4. Trigger Rollout
echo "🔄 Triggering manual rollout..."
firebase apphosting:rollouts:create nextn --project memory-weaver-8rk9t

echo "✅ Sequence complete. Monitor the rollout in the Firebase Console."
