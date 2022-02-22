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

# Create the PDF
pandoc --variable papersize=Letter --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/*.md -o $tmpdir/cairn-monsters-letter-tmp.pdf
pandoc --variable papersize=A4 --variable title="Cairn Monsters" --variable subtitle="Compiled on " --variable subtitle="$currentdate" --variable subtitle=" by Yochai Gal | CC-BY-SA 4.0" --variable mainfont=Alegreya --variable sansfont=Alegreya --variable monofont=Alegreya -f gfm --toc -s $tmpdir/*.md -o $tmpdir/cairn-monsters-a4-tmp.pdf
pdftk "$destdir/covers/letter/cairn-monsters-letter-front-cover.pdf" $tmpdir/cairn-monsters-letter-tmp.pdf "$destdir/covers/letter/cairn-monsters-letter-back-cover.pdf" cat output "$destdir/cairn-monsters-letter.pdf"
pdftk "$destdir/covers/a4/cairn-monsters-a4-front-cover.pdf" $tmpdir/cairn-monsters-a4-tmp.pdf "$destdir/covers/a4/cairn-monsters-a4-back-cover.pdf" cat output "$destdir/cairn-monsters-a4.pdf"

# Make the booklet
pdfbook2 --paper=letter -s $tmpdir/cairn-monsters-letter-tmp.pdf
pdfbook2 --paper=a4paper -s $tmpdir/cairn-monsters-a4-tmp.pdf
pdftk "$destdir/covers/letter/cairn-monsters-letter-covers-landscape.pdf" $tmpdir/cairn-monsters-letter-tmp-book.pdf cat output "$destdir/cairn-monsters-letter-booklet.pdf"
pdftk "$destdir/covers/a4/cairn-monsters-a4-covers-landscape.pdf" $tmpdir/cairn-monsters-a4-tmp-book.pdf cat output "$destdir/cairn-monsters-a4-booklet.pdf"
rm -rf $tmpdir
