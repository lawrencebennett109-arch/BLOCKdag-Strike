#!/bin/bash
# Replace REMOTE_URL with your repo
REMOTE_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"
git init
git add .
git commit -m "Initial frontend with realistic placeholder assets"
git branch -M main
git remote add origin $REMOTE_URL
git push -u origin main
