---
layout: default
redirect_from: /resources/tools/foundryvtt-system
title: Foundry VTT System
parent: Resources
nav_order: 3
---

# Foundry VTT System  
Cairn has a robust system for [Foundry VTT](https://foundryvtt.com/), the popular virtual tabletop program. You can install Cairn directly from within Foundry, or you can do so manually via the [Github Repo](https://github.com/yochaigal/Cairn-FoundryVTT).

There are a number of compendium packs (and one macro) that must be imported into the "world"; make sure that all players have the "Observer" permissions so that they can generate a character themselves. You'll also need to change the "Player" Role permissions to allow them to create Actors.

## Automatic Monster Import

This guide describes how to automate the process of importing monster descriptions and stats into [Foundry VTT](https://foundryvtt.com/) using a combination of Ruby and JavaScript. The process allows for seamless conversion of monster data from markdown to JSON, and then automatically creates or updates actors within Foundry VTT.

### Prerequisites
1. **Foundry VTT**: Ensure you have Foundry VTT installed and set up.
2. **Ruby**: You'll need Ruby installed on your system. [Learn how here](https://www.ruby-lang.org/en/documentation/installation/)
3. **Redcarpet Gem**: The Ruby script requires the `redcarpet` gem to parse markdown. Install it by running:
   ```bash
   gem install redcarpet
   ```

### Step-by-Step Guide

#### 1. Prepare Your Monsters in Markdown

Make sure your monsters are written in markdown format. Each file should include all relevant stats, including HP, STR, DEX, WIL, armor, and attacks. For example:

```markdown
# Black Dragon

16 HP, 1 Armor, 13 STR, 18 DEX, 14 WIL, bite (d12), claws (d10+d10)
- Amphibious dragons with glossy black scales and thick hides. 
- Dwell in swamps or similarly dangerous environments.
```

Ensure all your markdown files are placed in a folder called `monsters`.

#### 2. Run the Ruby Script

Download the Ruby script [from the repository](https://github.com/yochaigal/cairn/blob/main/generate_monster_json.rb). Place the script in the same directory as your `monsters` folder. The script reads the markdown files, extracts the monster stats, and outputs a JSON file with all the monster data.

To run the script:

```bash
ruby generate_monster_json.rb > monsters.json
```

This will generate a `monsters.json` file in the same folder, containing all the parsed monster data.

#### 3. Import the Monsters into Foundry VTT

Now that you have your `monsters.json`, you can import the data into Foundry VTT.

1. **Open Foundry VTT** and create a new script macro.
2. Copy the following JavaScript code into the editor:

```javascript
// Prompt the user for JSON input
let jsonInput = await new Promise((resolve) => {
  new Dialog({
    title: "Monster JSON Input",
    content: `<textarea id="json-input" style="width:100%;height:200px;"></textarea>`,
    buttons: {
      ok: {
        label: "OK",
        callback: (html) => resolve(html.find("#json-input").val())
      }
    }
  }).render(true);
});

// Parse the user input JSON
let monstersJson;
try {
  monstersJson = JSON.parse(jsonInput);
} catch (e) {
  ui.notifications.error("Invalid JSON. Please try again.");
  throw e;
}

// Find the "monsters" folder, create it if it doesn't exist
let monsterFolder = game.folders.find(folder => folder.name == "monsters" && folder.type == "Actor");
if (monsterFolder == undefined) {
    monsterFolder = await Folder.create({ name: "monsters", type: "Actor" });
}

let updateActor = async function(monsterData) {
    // Check if the monster actor already exists
    let monsterActor = game.actors.find(actor => actor.name == monsterData.name);
    if (monsterActor == undefined) {
        // Create a new actor inside the "monsters" folder with the correct structure
        let actorData = {
            name: monsterData.name,
            type: "npc",
            folder: monsterFolder.id,
            system: {
                hp: {
                    value: parseInt(monsterData.stats.hp),
                    max: parseInt(monsterData.stats.hp)
                },
                abilities: {
                    STR: {
                        value: parseInt(monsterData.stats.str),
                        max: parseInt(monsterData.stats.str)
                    },
                    DEX: {
                        value: parseInt(monsterData.stats.dex),
                        max: parseInt(monsterData.stats.dex)
                    },
                    WIL: {
                        value: parseInt(monsterData.stats.wil),
                        max: parseInt(monsterData.stats.wil)
                    }
                },
                description: monsterData.description
            },
            items: monsterData.stats.attacks.map(attack => ({
                name: attack.name,
                type: "item", // Define this as an item
                system: {
                    damageFormula: attack.damage,
                    equipped: true // Ensure the item is equipped
                }
            })),
            prototypeToken: {
                name: monsterData.name,
                bar1: { attribute: "system.hp" },
                bar2: { attribute: "system.abilities.STR" }
            }
        };

        // Create the actor
        monsterActor = await Actor.create(actorData);

        // If armor is present, create and equip a Default Armor item
        if (monsterData.stats.armor) {
            let armorItem = {
                name: "Default Armor",
                type: "armor",
                img: "icons/svg/item-bag.svg", // Placeholder image
                system: {
                    armor: parseInt(monsterData.stats.armor),
                    equipped: true,  // Automatically equip the armor
                    bulky: false,
                    weightless: false,
                    uses: {
                        value: 0,
                        max: 0
                    }
                }
            };

            // Add the armor item to the actor
            await monsterActor.createEmbeddedDocuments("Item", [armorItem]);
        }
    } else {
        // Update the actor's description, stats, and items if it already exists
        let updateData = {
            "system.hp.value": parseInt(monsterData.stats.hp),
            "system.hp.max": parseInt(monsterData.stats.hp), // Set the max HP here
            "system.abilities.STR.value": parseInt(monsterData.stats.str),
            "system.abilities.STR.max": parseInt(monsterData.stats.str), // Set the max STR here
            "system.abilities.DEX.value": parseInt(monsterData.stats.dex),
            "system.abilities.DEX.max": parseInt(monsterData.stats.dex), // Set the max DEX here
            "system.abilities.WIL.value": parseInt(monsterData.stats.wil),
            "system.abilities.WIL.max": parseInt(monsterData.stats.wil), // Set the max WIL here
            "system.description": monsterData.description
        };

        await monsterActor.update(updateData);

        // Update or add the attacks (items)
        let attackItems = monsterData.stats.attacks.map(attack => ({
            name: attack.name,
            type: "item",
            system: {
                damageFormula: attack.damage,
                equipped: true // Ensure the item is equipped
            }
        }));

        // Update the items (replace or add)
        await monsterActor.updateEmbeddedDocuments("Item", attackItems);

        // If armor is present, create and equip a Default Armor item if not already present
        if (monsterData.stats.armor) {
            let existingArmor = monsterActor.items.find(i => i.name === "Default Armor");
            if (!existingArmor) {
                let armorItem = {
                    name: "Default Armor",
                    type: "armor",
                    img: "icons/svg/item-bag.svg", // Placeholder image
                    system: {
                        armor: parseInt(monsterData.stats.armor),
                        equipped: true,  // Automatically equip the armor
                        bulky: false,
                        weightless: false,
                        uses: {
                            value: 0,
                            max: 0
                        }
                    }
                };

                // Add the armor item to the actor
                await monsterActor.createEmbeddedDocuments("Item", [armorItem]);
            }
        }
    }
};

// Iterate over all monsters and update or create them
monstersJson.forEach(m => updateActor(m));
```

#### 4. Paste Your JSON Data

Once you've created a new Foundry VTT macro and copied the above script into it, save the macro and run it. A dialog box will appear, allowing you to paste the contents of `monsters.json` into the field. After pasting, click "OK" to run the import process.

#### 5. Enjoy

The script will create or update your monster actors, including their stats, descriptions, attacks, and armor. All items, such as weapons and armor, will be automatically equipped.

---

And that's it! You've now automated the process of importing monsters into Foundry VTT from markdown files, saving you valuable time.
