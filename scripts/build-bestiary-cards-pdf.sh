#!/bin/bash
# This creates a printable PDF of all the monster cards in both Letter and A4 formats.
montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" -mode concatenate -tile 3x3 -geometry +20+20 -page letter -rotate 90 "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-letter.pdf"
montage "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards/*.png" -mode concatenate -tile 3x3 -geometry +20+20 -page a4 -rotate 90 "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards-a4.pdf"
