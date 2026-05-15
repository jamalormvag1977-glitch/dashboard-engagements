#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
while true; do
  echo "[$(date)] Starting Next.js production server..."
  node .next/standalone/server.js
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
