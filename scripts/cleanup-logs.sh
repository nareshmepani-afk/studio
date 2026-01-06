#!/bin/bash

# Define the log files to be cleaned
LOG_FILES=(
  "firebase-debug.log"
  "firestore-debug.log"
  "ui-debug.log"
)

echo "--- Starting Log Clean-up: $(date) ---"

for file in "${LOG_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Cleaning $file..."
    # Clear the content of the file without deleting it
    > "$file"
  else
    echo "$file not found, skipping."
  fi
done

# Clean up Playwright artifacts if they exist
if [ -d "playwright-report" ]; then
  echo "Cleaning playwright-report directory..."
  rm -rf playwright-report/*
fi

if [ -d "test-results" ]; then
    echo "Cleaning test-results directory..."
    rm -rf test-results/*
fi

echo "--- Log Clean-up Completed: $(date) ---"
