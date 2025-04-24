#!/bin/bash

tmux new -s website
tmux send-keys -t website "cd ~/PersonalWebsite" ENTER
tmux send-keys -t website "source env/bin/activate" ENTER
tmux send-keys -t website "python3 main.py" ENTER
