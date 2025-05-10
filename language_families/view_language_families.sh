#!/bin/bash

# Kill previous server on port 8000 if running
lsof -ti tcp:8000 | xargs kill -9 2>/dev/null

# Navigate to the visualization folder
cd visualization || { echo "❌ visualization folder not found"; exit 1; }

# Start HTTP server in the background
python3 -m http.server 8000 &

# Wait a moment to ensure server is running
sleep 1

# Open the tree viewer
if command -v open >/dev/null; then
    open http://localhost:8000
elif command -v xdg-open >/dev/null; then
    xdg-open http://localhost:8000
else
    echo "🌐 Open http://localhost:8000 manually"
fi
