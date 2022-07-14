#!/bin/bash
# This creates a compiled PDF of all the monster stat blocks in both A4 and Letter formats (including booklets)
scriptdir="/home/yochai/github/cairn/scripts"
sourcedir="/home/yochai/github/cairn/resources/monsters"
tmpdir="/home/yochai/Downloads/tmp"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters"
currentdate="$(date "+%B %e, %Y")"
mkdir -p $tmpdir/monsters
rsync -av $sourcedir/ $tmpdir/monsters/
sed -i -f clean.sed $tmpdir/monsters/*.md
sed -i -f prep.sed $tmpdir/monsters/*.md
cat $tmpdir/monsters/*.md >> $tmpdir/all-monsters.md

# Create the PDF
pandoc  --verbose \
        -s $tmpdir/all-monsters.md \
        -V geometry=letterpaper \
	-V title="Cairn Bestiary" \
        -V subtitle="Compiled on " \
        -V subtitle="$currentdate" \
        -V subtitle=" by Yochai Gal | CC-BY-SA 4.0" \
        -V fontfamily="Alegreya" \
        -V fontsize=12pt \
        --metadata=title:"Cairn Bestiary" \
        --metadata=author:"Yochai Gal" \
        --metadata=lang:"en-US" \
        --metadata=cover-image:"$scriptdir/covers/cairn-monsters-front-cover.png" \
	--toc \
   	--template=build.tex \
	-o $tmpdir/cairn-monsters-letter-tmp.pdf
