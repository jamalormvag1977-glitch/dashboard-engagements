#!/bin/bash
cd /home/z/my-project
while true; do
    node .next/standalone/server.js 2>/tmp/server-daemon-err.log
    sleep 2
done
