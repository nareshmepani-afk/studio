#!/bin/bash
#
# This script checks that all secrets referenced in apphosting.yaml are accessible
# by the Firebase App Hosting service account.
#

# The service account that needs access to the secrets.
SERVICE_ACCOUNT="serviceAccount:firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com"
ROLE="roles/secretmanager.secretAccessor"

# Find the apphosting.yaml file
APP_HOSTING_FILE="apphosting.yaml"

if [ ! -f "$APP_HOSTING_FILE" ]; then
    echo "Error: Could not find $APP_HOSTING_FILE in the current directory."
    exit 1
fi

# Extract secret names from apphosting.yaml
# Handles both simple and complex secret definitions
SECRETS=$(grep "secret:" "$APP_HOSTING_FILE" | awk -F': ' '{print $2}' | tr -d '"' | tr -d "'")

if [ -z "$SECRETS" ]; then
    echo "No secrets found in $APP_HOSTING_FILE."
    exit 0
fi

echo "Verifying permissions for secrets in $APP_HOSTING_FILE..."
echo "Service Account: $SERVICE_ACCOUNT"
echo "--------------------------------------------------------"

for SECRET_NAME in $SECRETS; do
    echo -n "Checking secret: $SECRET_NAME... "
    
    # Get IAM policy for the secret
    POLICY=$(gcloud secrets get-iam-policy "$SECRET_NAME" --format=json 2>/dev/null)
    
    if [ -z "$POLICY" ]; then
        echo -e "\033[0;31mNOT FOUND (Check if secret exists in Secret Manager)\033[0m"
        continue
    fi

    # Check if the service account has the required role
    HAS_ROLE=$(echo "$POLICY" | jq -r --arg sa "$SERVICE_ACCOUNT" --arg r "$ROLE" '.bindings[] | select(.role == $r) | .members[] | select(. == $sa)')

    if [ -n "$HAS_ROLE" ]; then
        echo -e "\033[0;32mOK\033[0m"
    else
        echo -e "\033[0;31mPERMISSION MISSING\033[0m"
        echo "Run this to fix:"
        echo "gcloud secrets add-iam-policy-binding $SECRET_NAME --member=\"$SERVICE_ACCOUNT\" --role=\"$ROLE\""
    fi
done

echo "--------------------------------------------------------"
echo "Check complete. Ensure all secrets are marked 'OK' before deploying."
