#!/bin/bash
# Opens the Script Visualizer with full Netlify backend
cd "$(dirname "$0")"
echo "Starting Netlify Dev — opening Script Visualizer..."
open "http://localhost:8888/_visualization/script-visualization.html"
npx netlify dev
