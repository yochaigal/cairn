#!/bin/bash
# This script runs the python script to build the images, then creates a printable PDF of all the monster cards in both Letter and A4 formats.
# Update the python virtualenvs to match your own. I created a folder (~/builds/build-bestiary) and ran "pipenv shell" to create what you see below.

source /home/yochai/.local/share/virtualenvs/cards-JSchktpj/bin/activate
/home/yochai/.local/share/virtualenvs/cards-JSchktpj/bin/python /home/yochai/github/cairn/scripts/cards/build-bestiary-cards-images.py
montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" -mode concatenate -tile 3x3 -geometry +20+20 -page letter -rotate 90 "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-letter.pdf"
montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" -mode concatenate -tile 3x3 -geometry +20+20 -page a4 -rotate 90 "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-a4.pdf"
