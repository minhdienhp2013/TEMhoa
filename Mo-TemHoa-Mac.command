#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Can Python 3 de mo ban nay tren Mac. Hay cai Python 3 tu python.org."
  read -r -p "Nhan Enter de dong..."
  exit 1
fi
exec python3 mo_temhoa.py
