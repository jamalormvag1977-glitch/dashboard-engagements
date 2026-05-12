#!/bin/bash
while true; do
    cd /home/z/my-project
    node .next/standalone/server.js 2>>/tmp/ka.log
    echo "Restart at $(date)" >> /tmp/ka.log
    sleep 1
done
