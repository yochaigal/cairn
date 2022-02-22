#!/bin/bash
# This creates a compiled PDF of all the monster stat blocks in both A4 and Letter formats (including booklets)
sourcedir="/home/yochai/github/cairn/resources/monsters"
tmpdir="/tmp/monsters"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters"
currentdate="$(date "+%B %e, %Y")"
rsync -av $sourcedir $tmpdir/
sed -i '/^author/d' $tmpdir/monsters/*.md
sed -i '/^source:/d' $tmpdir/monsters/*.md
sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' $tmpdir/monsters/*.md
pandoc --variable papersize=Letter --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/*.md -o $tmpdir/cairn-monsters-letter-tmp.pdf
pandoc --variable papersize=A4 --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/*.md -o $tmpdir/cairn-monsters-a4-tmp.pdf
pdftk "$destdir/source/cairn-monsters-letter-front-cover.pdf" $tmpdir/cairn-monsters-letter-tmp.pdf "$destdir/source/cairn-monsters-letter-back-cover.pdf" cat output "$destdir/cairn-monsters-letter.pdf"
pdftk "$destdir/source/cairn-monsters-a4-front-cover.pdf" $tmpdir/cairn-monsters-a4-tmp.pdf "$destdir/source/cairn-monsters-a4-back-cover.pdf" cat output "$destdir/cairn-monsters-a4.pdf"
pdfbook2 --paper=letter -s "$destdir/cairn-monsters-letter.pdf"
pdfbook2 --paper=a4paper -s "$destdir/cairn-monsters-a4.pdf"
rm -rf $tmpdir
