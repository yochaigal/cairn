---
layout: default
title: Website Notes
search_exclude: true
nav_exclude: true
---

# Website Notes

### To Compile all Monsters into PDF:
```sed -i '/^author/d' *.md```
```pandoc *.md -o monsters.pdf```
