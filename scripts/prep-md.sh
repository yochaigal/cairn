#!/bin/bash
# This creates a compiled PDF of all the monster stat blocks in both A4 and Letter formats (including booklets)
sourcedir="/home/yochai/github/cairn/resources/monsters"
tmpdir="/tmp/monsters"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters"
currentdate="$(date "+%B %e, %Y")"
rsync -av $sourcedir/ $tmpdir/
sed -i '/^author/d' $tmpdir/*.md
sed -i '/^source:/d' $tmpdir/*.md
sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' $tmpdir/*.md
sed -i '1 s/^/\\begin{samepage}\n/' $tmpdir/*.md
sed -i '$a \\\end{samepage}\n' $tmpdir/*.md

# Create the PDF
pandoc --variable papersize=Letter --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/*.md -o $tmpdir/cairn-monsters-letter-tmp.pdf
