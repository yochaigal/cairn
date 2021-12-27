---
layout: default
title: Website Notes
search_exclude: true
nav_exclude: true
---

# Website Notes

### To Compile all Monsters into PDF:
`#!/bin/bash
date="$(date "+%B %e, %Y")"
rsync -av /home/yochai/github/cairn/resources/monsters/ --exclude=all-monsters.md /tmp/monsters/
sed -i '/^author/d' /tmp/monsters/*.md
sed -i '/^source:/d' /tmp/monsters/*.md
sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' /tmp/monsters/*.md
pandoc --variable papersize=Letter --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$date" --variable subtitle=" by Yochai Gal, CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s /tmp/monsters/*.md -o "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-monsters.pdf"
rm -rf /tmp/monsters
`
