#!/bin/bash
# This script builds images and combines them into printable PDFs (Letter and A4).
# Requires Pipenv environment in the same directory as the Python script.

cd /home/yochai/github/cairn/scripts/cards || exit 1

pipenv run python build-bestiary-cards-images.py

montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" \
  -mode concatenate -tile 3x3 -geometry +20+20 -page letter -rotate 90 \
  "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-letter.pdf"

montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" \
  -mode concatenate -tile 3x3 -geometry +20+20 -page a4 -rotate 90 \
  "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-a4.pdf"
