---
layout: default
title: Home
nav_order: 1
permalink: /
---

**Terra Odd** is a multipurpose game where the theme is   $math$

n [adventure game](http://questingblog.com/adventure-game-vs-osr) about exploring a dark & mysterious Wood filled with strange folk, hidden treasure, and unspeakable monstrosities. Character generation is quick and random, classless, and relies on fictional advancement rather than through XP or level mechanics. 


The repository and website set up is forked from Cairn.
The system is MOTO.
It takes learnings from a previous iteration Terra System.

It is based on [Knave](https://www.drivethrurpg.com/product/250888/Knave) by Ben Milton and [Into The Odd](https://chrismcdee.itch.io/electric-bastionland) by Chris McDowall. The game was written by [Yochai Gal](https://newschoolrevolution.com).

The PDF version is available for free on [Itch.io](https://yochaigal.itch.io/cairn) & [DriveThruRPG](https://www.drivethrurpg.com/product/330809/Cairn).  
The full text is licensed under [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).  
The original Affinity Publisher file is also available with the downloads.

This is a game that values community contributions! If you'd like to submit an adventure, hack, monster, or conversion take a look at the [submission guide](/submissions/submission-guide).

<p></p>

![poster](img/poster.png)



## Collaborate


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
