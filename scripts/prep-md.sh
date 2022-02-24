#!/bin/bash
# This creates a compiled PDF of all the monster stat blocks in both A4 and Letter formats (including booklets)
scriptdir="/home/yochai/github/cairn/scripts"
sourcedir="/home/yochai/github/cairn/resources/monsters"
tmpdir="/tmp/monsters"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters"
currentdate="$(date "+%B %e, %Y")"
#rsync -av $sourcedir/ $tmpdir/
#sed -i '/^author/d' $tmpdir/*.md
#sed -i '/^source:/d' $tmpdir/*.md
#sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' $tmpdir/*.md
#sed -i '1 s/^/\\begin{samepage}\n/' $tmpdir/*.md
#sed -i '$a \\\end{samepage}\n' $tmpdir/*.md

# Create the PDF
pandoc  -s $tmpdir/*.md \
        -V papersize=Letter \
        -V title="Cairn Bestiary" \
        -V subtitle="Compiled on " \
        -V subtitle="$currentdate" \
        -V subtitle=" by Yochai Gal | CC-BY-SA 4.0" \
        -V 'mainfont:Alegreya' \
        -V fontsize=12pt \
        --metadata=title:"Cairn Bestiary" \
        --metadata=author:"Yochai Gal" \
        --metadata=lang:"en-US" \
        --metadata=cover-image:"$scriptdir/covers/cairn-monsters-letter-front-cover.png" \
        -f gfm \
        --toc \
        -H head.tex \
        --pdf-engine=lualatex \
        -o $tmpdir/cairn-monsters-letter-tmp.pdf
