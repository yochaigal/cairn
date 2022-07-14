#!/bin/bash
# creates compiled monster PDFs (letter/A4) and booklets, then monster cards (PNG) and PDFs (Letter/A4)
sh /home/yochai/github/cairn/scripts/build-bestiary-pdf.sh
python3 /home/yochai/github/cairn/scripts/bestiary_cards.py
sh /home/yochai/github/cairn/scripts/build-bestiary-cards-pdf.sh