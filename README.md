---
layout: default
title: Home
nav_order: 1
permalink: /
---

# Terra Odd
***v0.7.1b***

**Terra Odd** is a modular implementation or Cairn / Into the Odd that aims to allow games in to be played in different genres and aesthetics.

It also contains GM materials for planning & running sessions.

This webpage and the repository are a fork from [Yochai Gal](https://newschoolrevolution.com).'s [Cairn](https://cairnrpg.com/).
Cairn is based on [Knave](https://www.drivethrurpg.com/product/250888/Knave) by Ben Milton and [Into The Odd](https://chrismcdee.itch.io/electric-bastionland) by Chris McDowall. 

Additional influences are:

- Fallout subsystem, from [Liminal Horror](https://goblinarchives.github.io/LiminalHorror/)

![poster](img/poster.png)

<p></p>

## Contribute


Tech:

- install jekyll [mac](https://jekyllrb.com/docs/installation/macos/)

````
echo '3.1.3' >> .ruby-version
gem install bundler jekyll
bundle install

````

on repo folder


```
bundle exec jekyll serve
```
=> Now browse to http://localhost:4000

You can make real time changes in the files, and the state of your simulated site will reflect.

if error


```
bundle clean --force
gem update
bundle add webrick
```
