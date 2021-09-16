---
layout: default
title: Foundry VTT System
parent: Resources
nav_order: 8
---

# Foundry VTT System


Cairn has a robust system for [Foundry VTT](https://foundryvtt.com/), the popular virtual tabletop program. You can install Cairn directly from within Foundry, or you can do so manually via the [Github Repo](https://github.com/yochaigal/Cairn-FoundryVTT).

There are a number of compendium packs (and one macro) that must be imported into the "world"; make sure that all players have the "Observer" permissions so that they can generate a character themselves. You'll also need to change the "Player" Role permissions to allow them to create Actors.

## Import Monster Descriptions into Foundry VTT automatically
[Stephen Mariano Cabrera](https://github.com/smcabrera) has created an excellent little Ruby script that converts monster descriptions from markdown and into JSON format, which can then be imported into Foundry with Javascript. Here is how you do it:
- Create monster Actors in Foundry; you can ignore descriptions for now.
- Ensure that the monsters are all in written in markdown (see examples [here](https://github.com/yochaigal/cairn/tree/main/monsters)). Put them all in a folder called "monsters" or modify script to match something else.
- Grab the Ruby script from the Cairn [github repo](https://github.com/yochaigal/cairn/blob/main/generate_monster_json.rb) and put it the same folder.
- Make sure you have ruby; you will need to install the redcarpet gem as well.
- Run generate_monster_json.rb > monsters.json.
- Open monsters.json and copy the text to clipboard.
- Within Foundry's Script editor, create a new script and copy this script into it:

```
let monstersJson =  [monsters.json contents]

let updateActor = function(monstersJson) {
let  monsterActor = game.actors.entities.find(actor => actor.name == monstersJson.name)
  if (monsterActor == undefined) {
    console.log(monstersJson)
  } else {
    monsterActor.update({ "data": { "description": monstersJson.description }})
  }
}
monstersJson.forEach(m => updateActor(m))
```

As you can see, the contents of monsters.json should go in between the brackets in the first line.
That's it. Execute the macro.

Perhaps one day you should be able to run the script without creating the Actors first. I hope this method saves you some time, regardless.
