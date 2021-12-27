---
layout: default
title: Website Notes
search_exclude: true
nav_exclude: true
---

# Website Notes

### To Compile all Monsters into PDF:
```rsync -av cairn/resources/monsters/ --exclude=all-monsters.md ~/Downloads/```
```sed -i '/^author/d' *.md```
```sed -i '/^source:/d' *.md```
```pandoc *.md -o monsters.pdf```
