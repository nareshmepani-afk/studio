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
# This uses grep to find lines with 'secret:', then awk to get the value after the colon.
SECRETS=$(grep "secret:" "$APP_HOSTING_FILE" | awk -F': ' '{print $2}')

if [ -z "$SECRETS" ]; then
    echo "No secrets found in $APP_HOSTING_FILE."
    exit 0
fi

echo "Verifying permissions for secrets in $APP_HOSTING_FILE..."
echo "--------------------------------------------------------"

for SECRET_NAME in $SECRETS; do
    echo -n "Checking secret: $SECRET_NAME... "
    
    # Get the IAM policy for the secret and check for the specific member and role
    POLICY=$(gcloud secrets get-iam-policy "$SECRET_NAME" --format=json 2>/dev/null)
    
    if [ -z "$POLICY" ]; then
        echo -e "\033[0;31mNOT FOUND\033[0m"
        continue
    fi

    MEMBER_EXISTS=$(echo "$POLICY" | grep "\"member\": \"$SERVICE_ACCOUNT\"")
    
    if [ -z "$MEMBER_EXISTS" ]; then
        echo -e "\033[0;31mPERMISSION MISSING\033[0m (Service account not found in policy)"
    else
        # Check if the member has the correct role
        # This is a bit complex because a member can have multiple roles.
        # We use jq to parse the JSON and find the binding for our service account.
        HAS_ROLE=$(echo "$POLICY" | jq -r ".bindings[] | select(.members[] == \"$SERVICE_ACCOUNT\") | .role" | grep "$ROLE")

        if [ -n "$HAS_ROLE" ]; then
            echo -e "\033[0;32mOK\033[0m"
        else
            echo -e "\033[0;31mPERMISSION MISSING\033[0m (Role '$ROLE' not assigned)"
        fi
    fi
done

echo "--------------------------------------------------------"
echo "Check complete. Ensure all secrets are marked 'OK' before deploying."
