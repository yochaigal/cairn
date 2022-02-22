#!/bin/bash
# This creates a compiled PDF of all the monster stat blocks in both A4 and Letter formats (including booklets)
sourcedir="/home/yochai/github/cairn/resources/monsters/"
tmpdir="/tmp/"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/"
currentdate="$(date "+%B %e, %Y")"
rsync -av $sourcedir $tmpdir
cd $tmpdir
sed -i '/^author/d' $tmpdir/*.md
sed -i '/^source:/d' $tmpdir/*.md
sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' $tmpdir/*.md
pandoc --variable papersize=Letter --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/monsters/*.md -o $destdir/cairn-monsters-letter-tmp.pdf
pandoc --variable papersize=A4 --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/monsters/*.md -o $destdir/cairn-monsters-a4-tmp.pdf
pdftk $destdir/cairn-monsters-cover-letter.pdf $destdir/cairn-monsters-letter-tmp.pdf cat output $destdir/cairn-monsters-letter.pdf
pdftk $destdir/cairn-monsters-cover-a4.pdf $destdir/Monsters/cairn-monsters-a4-tmp.pdf cat output $destdir/cairn-monsters-a4.pdf
pdfbook2 --paper=letter -s $destdir/cairn-monsters-letter-tmp.pdf
pdfbook2 --paper=a4paper -s $destdir/cairn-monsters-a4-tmp.pdf
rm -rf $tmpdir/monsters
