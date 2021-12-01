---
layout: default
title: Converting Monsters
nav_order: 3
parent: Resources
---

# Converting Monsters

There is no perfect system for converting from other systems.  
Below are some tips that might help with the process!

## The Basics
Review the instructions in the [SRD](https://cairnrpg.com/cairn-srd/#creating-monsters). A couple of things to keep in mind:
- OSE (or B/X) has really great stat blocks that can be easily truncated for quick conversion.
- **HD** conversion is usually the hardest to grok. Convert _first_ **HP**, _then_ **STR**. You might use a creature's original **HD** twice during a conversion or not at all depending on the level of detail in the stat block.
- Dungeon World has some great monster "moves" that translate to Critical Damage quite nicely, so looking for an equivalent creature in that system can really help! See this example [here](http://codex.dungeon-world.com/monster/5698559156420608).
- Sometimes a direct stat to stat translation isn't an option. That's OK! There is a [way](/resources/converting-monsters/#use-the-fiction))!

### Health, Armor & Abilities
- **Hit Protection** is _not_ health. It's the creature's ability to avoid danger, whether through toughness, speed, or skill. If the PCs will have a tough time landing a blow that actually causes damage, the creature has high **HP**. A good rule of thumb is 1 **HD** = 1 **HP**, keeping in mind that the minimum is 4 HP (Cairn). I usually think of **HD** as equivalent to a d6, which has a _mean_ of 3.5.
- **Armor** is generally easy to map; phrases like "as leather" and "as plate" are really helpful. Generally ignore THAC0 and use descending AC (7 = Leather, 5 = Chainmail, 3 = Plate mail). If only ascending AC is given you can use (12 = Leather, 14 = Chainmail, 16 = Plate mail).
- **Strength** is both health and physical power.  It also tracks constitution & resistance to poisons.  Look at the creature's **HD** and **HP** (even if you've already done so for **Hit Protection**). **STR** is how long the creature can stay in the fight _after_ getting hit, not ability to avoid danger. If a creature is difficult to kill but _not_ because they are good avoiding injury, give them more **STR** but _not_ more **HP**. A good rule of thumb is to compare the creature to an average human (10 **STR**) and go up or down from there.
- **Dexterity** is probably the easiest of the bunch. Start with **10** as a base and if the creature is particularly quick, agile or nimble-fingered make it go up. If it is slow to respond, bulky or clumsy, lower the number.
- **Willpower** is tricky. It rarely comes up but when it does, it's nice to have. High **WIL** is strong personality, spirit or presence. **Morale** (**ML**) can be a good guidepost for **Willpower** as well. Morale typically ranges between 2-12; some games use a "Morale Check" is used to determine if a monster flees (in Cairn a **WIL** save is used instead). The referee rolls 2d6; if the result is higher than the monster's **ML** score, they flee.  

The following table offers a decent guide on converting **ML** to **WIL**.

|         |   |    |    |    |
|---------|---|----|----|----|
| **ML**  | 4 | 8  | 10 | 12 |
| **WIL** | 6 | 12 | 15 | 18 |

### Combat
- Attack **damage** is pretty straightforward coming from games like OSE (or B / X); you can usually just copy them as-is. Double-check with the [weapons table](/cairn-srd/#weapons) if unsure.
- Multiple attacks (e.g. 2 x claw, 1 x sting) typically convert to [_Blast_](/cairn-srd#Blast) and/or the "two weapons" rule (e.g. d6+d6 is roll 2d6, keep highest).
- When in doubt, think about how much serious damage the creature is supposed to do. Remember that instead of raising attack damage a step, think about making it _enhanced_ in certain situations or use the _Blast_ and "two weapons" rule.

### Abilities & Magic
- Some abilities simply won't translate directly! That's OK, not every system is equivalent. If for example an OSR monster has an attack that assumes the PCs will be able to dodge or defend against, you might need to rewrite it a bit. Perhaps make it a weapon, and assign a damage die, making Critical Damage reveal the damage. More often you should simply let the ability or attack _happen_. Combat is dangerous, and it is up to the Warden to properly telegraph danger before the fighting begins.
- Spells are tricky; you can give wizardy-types Spellbooks but remember, the creature might _drop_ them when they are defeated. I like to make 1d4 dropped Spellbooks implode ([Die of Fate](/cairn-srd#die-of-fate)).
- Magical creatures can just "know" a bunch of spells. In this case make their corpse magical (and dangerous).1

## Use The Fiction
Read the original stat block and surrounding commentary, then write a few sentences about the creature. Then convert what you've written to the Cairn monster stat block.

Take for example this OSR creature:

#### Foxwoman
Can take the form of a fox, a woman, or a 7' tall fox-headed.  
HD d8 HP HDx4 Speed 120' Armor 14 Morale 11 Attack: +4 d8hp (claw, bite or choke)
- Defense: Cannot be harmed by metal
- Special: Can transform into a fox or a maiden with one fox leg hidden (same stats) at will

_**Using the example above, I can see that she:**_  
- Appears as a 7-foot tall with a human woman with the head of a fox.
- Looking at the stats, it seems like she doesn't have too high HP, and she's quite fast.
- Agile and lithe.
- Attacks with deadly teeth and claws (choking her prey if possible).
- Transforms into a fox at will.
- Immune to metal weapons.

_**What can we learn from this?**_  
- She's fast, and probably savvy in a fight. She probably has higher than average Hit Protection (regular humans have 3 HP). **6 HP**.
- I don't think foxes have protective hides, and she's otherwise human beside her head. **No Armor**.
- She is decently strong. Normal human is 10 and she's bigger. **12 STR**.
- I can imagine her hunting prey over the snowy tundra. She's fast. **14 DEX**.
- Foxes are pretty cunning, right? Probably forceful and proactive in a tough situation. **11 WIL**.
- I'd go with **bite (d6)** for the teeth attack, and **claws (d8+d8)**, the same as any two-handed weapon.

_**In summary, that leaves us with the following opening statblock:**_  
6 HP, 12 STR, 14 DEX, 11 WIL, teeth (d6), claws (d8+d8)

_**Now on to her abilities:**_  
This is pretty straightforward. We simply read the fictional stat block we created earlier!
- We know what she looks like, and that she can transform into a fox at will.
- She cannot be harmed by metal; I'm taking this to mean she's immune to _metal weapons_.
- She chokes her victims.

_**Easy, right? Now to make it useful:**_  
- Appears as a 7-foot tall with a human woman with the head of a fox.
- Transforms into a fox at will.
- Immune to attacks from metal weapons.
- Critical damage: victim is choked unconscious, to be fed on soon after.

_**And that's it!**_
_**Behold, a converted Cairn monster:**_

#### Foxwoman
6 HP, 12 STR, 14 DEX, 11 WIL, teeth (d6), claws (d8+d8)
- Appears as a 7-foot tall with a human woman with the head of a fox.
- Transforms into a fox at will.
- Immune to attacks from metal weapons.
- Critical damage: victim is choked unconscious, to be fed on soon after.
