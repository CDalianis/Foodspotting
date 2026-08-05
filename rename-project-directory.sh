#!/usr/bin/env bash
set -euo pipefail

OLD_DIR="/c/Users/Christos/IdeaProjects/Cfprojectfoodspots"
NEW_DIR="/c/Users/Christos/IdeaProjects/projectfoodspots"

if [[ ! -d "$OLD_DIR" ]]; then
  if [[ -d "$NEW_DIR" ]]; then
    echo "Project directory is already renamed to projectfoodspots."
    exit 0
  fi
  echo "Old project directory not found: $OLD_DIR"
  exit 1
fi

if [[ -d "$NEW_DIR" ]]; then
  echo "Target directory already exists: $NEW_DIR"
  exit 1
fi

echo "Renaming project folder..."
mv "$OLD_DIR" "$NEW_DIR"

echo
echo "Done. Reopen the project from:"
echo "$NEW_DIR"
