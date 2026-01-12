# Deployment Troubleshooting Guide: The "Misconfigured Secret" Error

This guide addresses a common but frustrating error that can occur when deploying a Next.js application that uses server-side environment variables, specifically the `SERVICE_ACCOUNT_JSON` for Firebase Admin.

## The Problem: `FirebaseError: Failed to parse token`

When you deploy your application to a hosting provider (like Vercel, Netlify, or a similar service), your build logs or server logs might show an error like this:

```
Error: Failed to parse service account: Error: Failed to parse token, [object Object]
    at ...
Caused by: Error: Invalid PEM certificate
    at ...
```

This error almost always means that the `SERVICE_ACCOUNT_JSON` environment variable was not correctly formatted when it was added to your hosting provider's dashboard.

## The Root Cause: Line Breaks in JSON

The private key file (`.json`) you download from Firebase contains multiple lines (line breaks). When you copy this and paste it directly into a single-line input field for an environment variable, the hosting provider often fails to interpret it correctly. The line breaks get lost or converted into characters that break the JSON structure, leading to the "Failed to parse" error.

## The Solution: The Single-Line Trick

To fix this, you need to convert the multi-line JSON content into a single, continuous line before pasting it into your hosting provider's environment variable settings.

### Step 1: Locate Your Service Account File

Find the `.json` file you downloaded from your Firebase Project Settings under "Service Accounts."

### Step 2: Convert to a Single Line

Open a terminal and navigate to the directory where your service account file is located. Run the following command, replacing `your-service-account-file.json` with the actual name of your file:

**For macOS/Linux:**
```bash
cat your-service-account-file.json | tr -d '\n'
```

**For Windows (using PowerShell):**
```powershell
(Get-Content -Raw -Path your-service-account-file.json) -replace '\r?\n',''
```

This command will output the entire content of the JSON file as a single line in your terminal.

### Step 3: Copy and Paste the Single Line

1.  **Copy** the complete single-line output from your terminal.
2.  Go to your hosting provider's dashboard (e.g., Vercel).
3.  Navigate to your project's **Settings > Environment Variables**.
4.  Find the `SERVICE_ACCOUNT_JSON` variable.
5.  **Paste** the single-line string into the value field.
6.  **Save** the changes.

### Step 4: Redeploy Your Application

Trigger a new deployment for your project. This will ensure the build process uses the correctly formatted `SERVICE_ACCOUNT_JSON` variable.

Your deployment should now succeed without the `FirebaseError: Failed to parse token` error.
