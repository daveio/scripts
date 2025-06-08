#!/usr/bin/env fish

# Script to pull Qwen2.5 model variants in parallel using tmux
# Creates a tmux session with 7 panes, each downloading a different variant

# Check if required tools are available
if not command -v tmux >/dev/null
    echo "Error: tmux is not installed. Please install tmux first."
    exit 1
end

if not command -v ollama >/dev/null
    echo "Error: ollama is not installed. Please install ollama first."
    exit 1
end

# Define model variants
set models qwen2.5:72b qwen3:235b deepseek-r1:671b

# Kill any existing session with the same name
tmux kill-session -t qwen_downloads 2>/dev/null

# Start a new tmux session
echo "Starting tmux session for parallel downloads..."
tmux new-session -d -s qwen_downloads -n "Qwen Downloads"

# Set up the first pane
tmux send-keys -t qwen_downloads "echo 'Downloading $models[1]...' && ollama pull $models[1]" C-m

# Create the remaining panes and start downloads
for i in (seq 2 (count $models))
    # First 3 panes side by side horizontally
    if test $i -le 3
        tmux split-window -h -t qwen_downloads
        tmux select-layout -t qwen_downloads even-horizontal
        # Next 2 on bottom half, horizontally
    else if test $i -le 5
        tmux split-window -v -t qwen_downloads
        tmux select-layout -t qwen_downloads tiled
        # Last 2 on right side, vertically
    else
        tmux split-window -v -t qwen_downloads
        tmux select-layout -t qwen_downloads tiled
    end

    # Send command to the new pane
    tmux send-keys -t qwen_downloads "echo 'Downloading $models[$i]...' && ollama pull $models[$i]" C-m
end

# Apply final layout adjustments
tmux select-layout -t qwen_downloads tiled

# Attach to the session
echo "Starting downloads for all Qwen2.5 model variants in parallel..."
echo "Attaching to tmux session. Press Ctrl+B then D to detach without stopping downloads."
tmux attach-session -t qwen_downloads

echo "If you've detached from the session, you can reattach with:"
echo "tmux attach-session -t qwen_downloads"
