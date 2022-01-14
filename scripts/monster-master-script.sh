#!/bin/bash
# creates compiled monster PDFs (letter/A4) and booklets, then monster cards (PNG) and PDFs (Letter/A4)
sh /home/yochai/github/cairn/scripts/build-monsters-pdf.sh
python /home/yochai/github/cairn/scripts/monster_card2.py
