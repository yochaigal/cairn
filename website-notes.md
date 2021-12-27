---
layout: default
title: Website Notes
search_exclude: true
nav_exclude: true
---

# Website Notes

### To Compile all Monsters into PDF:
```rsync -av /home/yochai/github/cairn/resources/monsters --exclude=all-monsters.md /tmp/
sed -i '/^author/d' /tmp/monsters/*.md
sed -i '/^source:/d' /tmp/monsters/*.md
sed -i '1 { /^---/ { :a N; /\n---/! ba; d} }' /tmp/monsters/*.md
pandoc /tmp/monsters/*.md -f commonmark -o /home/yochai/Google\ Drive/Games/OSR/Into\ The\ Odd/hacks/Cairn/Monsters/monsters.pdf
rm -rf /tmp/monsters
````
