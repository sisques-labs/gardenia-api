#!/usr/bin/env bash
set -euo pipefail

echo "Configuring git merge drivers..."
git config merge.ours.driver true

echo "Done. Git is configured to auto-resolve version conflicts on promotion merges."
