#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
for candidate in python3.12 python3.13 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(not ((3,11)<=sys.version_info[:2]<(3,14)))'; then
    "$candidate" setup_background_ai.py
    result=$?
    read -r -p "Nhan Enter de dong..."
    exit "$result"
  fi
done
echo 'Can Python 3.12 tu https://www.python.org/downloads/'
read -r -p "Nhan Enter de dong..."
exit 1
