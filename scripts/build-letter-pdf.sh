#!/bin/bash
# This creates the interior files for the lulu print option
scriptdir="/home/yochai/github/cairn/scripts"
sourcedir="/home/yochai/github/cairn/resources/monsters"
tmpdir="/home/yochai/Downloads/tmp"
destdir="/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters"
currentdate="$(date +%m-%Y)"
mkdir -p $tmpdir/monsters
rsync -av $sourcedir/ $tmpdir/monsters/
sed -i -f prep.sed $tmpdir/monsters/*.md
cat $tmpdir/monsters/*.md >> $tmpdir/cairn-bestiary-tmp.md
cp sources/letter.tex $tmpdir/cairn-bestiary.tex
pandoc $tmpdir/cairn-bestiary-tmp.md -f markdown -t latex -o $tmpdir/cairn-bestiary-tmp.tex
cat $tmpdir/cairn-bestiary-tmp.tex >> $tmpdir/cairn-bestiary.tex
sed -i '$a \\\end{document}' $tmpdir/cairn-bestiary.tex
pdflatex -aux-directory=$tmpdir -output-directory=$tmpdir $tmpdir/cairn-bestiary.tex 
pdflatex -aux-directory=$tmpdir -output-directory=$tmpdir $tmpdir/cairn-bestiary.tex
mv $tmpdir/cairn-bestiary.pdf $tmpdir/cairn-bestiary-letter.pdf
pdftk "$scriptdir/covers/letter/cairn-bestiary-letter-front-cover.pdf" $tmpdir/cairn-bestiary-letter.pdf "$scriptdir/covers/letter/cairn-bestiary-letter-back-cover.pdf" cat output "$tmpdir/cairn-bestiary-letter-$currentdate.pdf"
pdfbook2 --paper=letter -s $tmpdir/cairn-bestiary-letter.pdf
pdftk "$scriptdir/covers/letter/cairn-bestiary-letter-covers-landscape.pdf" $tmpdir/cairn-bestiary-letter-book.pdf cat output "$destdir/cairn-bestiary-letter-booklet.pdf"
rm -rf $tmpdir