#!/bin/bash
# Script de sauvegarde du dashboard vers GitHub
# Usage: ./save-to-github.sh "message du commit"

cd /home/z/my-project

MESSAGE=${1:-"Auto-save $(date '+%Y-%m-%d %H:%M')"}

git add -A
git commit -m "$MESSAGE" --allow-empty
git push origin main

echo "✅ Sauvegardé sur GitHub : $MESSAGE"
