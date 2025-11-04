---
layout: default
title: Cairn: Barebones Edition
parent: Hacks
nav_order: 8
---

# Cairn: Barebones Edition

## Core Rules

## Attributes

Each Attribute is used in different circumstances (see **Saves**):

* **STR**: lifting/bending, forcing doors, resisting poison, enduring harm, melee exertion.
* **DEX**: dodging, balancing, climbing, stealth, delicate tasks, ranged finesse.
* **WIL**: persuading, deceiving, intimidating, perception under stress, spell manipulation.

## Saves

* A **save** is a roll to avoid negative outcomes from risky choices. Roll **d20** and compare to the appropriate Attribute. If you roll **equal to or under** that Attribute, you succeed; otherwise, you fail. A **1** is always a success, and a **20** is always a failure.
* If two opponents are each trying to overcome the other, **whoever is most at risk** should save.
* If two characters act together, **whoever is most at risk** should save (usually the character with the lowest relevant Attribute).

## Healing & Recovery

* **Short rest** (a few moments and a drink of water) restores lost **HP** but may leave the party exposed. **Bandages** can stabilize a character that has taken critical damage.
* **Attribute loss** (see **Critical Damage**) is usually restored with a **week’s rest**, facilitated by a healer or appropriate expertise.
* Some healing services are free; magical or expedient methods may come at a cost.

## Deprivation & Fatigue

* A PC lacking a crucial need (food, rest, warmth) is **Deprived**. Anyone **Deprived** for more than a day adds **Fatigue** to their inventory, one per day. A **Deprived** PC cannot recover HP, Attributes, or slots from **Fatigue**.
* PCs may also gain **Fatigue** after casting spells or due to events in the fiction. Each Fatigue fills **one slot** and lasts until the PC can recuperate (e.g., a full night’s rest in a safe place).
* If a character must add Fatigue and has no free slots, they must **drop an item**.

## Armor

* Before applying damage to **HP**, subtract the target’s **Armor** from the damage roll.
* Shields and similar items provide a **+1 Armor** bonus while held/worn; some may have additional benefits, depending on the fiction.
* Armor caps at **3**.

## Reactions

When the PCs encounter an NPC whose reaction isn’t obvious, roll **2d6**:

| 2       | 3–5  | 6–8     | 9–11 | 12      |
| - | - | - | - | - |
| Hostile | Wary | Curious | Kind | Helpful |

## Morale

* Enemies must pass a **WIL save** to avoid fleeing when they take their **first casualty** and again when they lose **half** their number.
* Some groups may use their **leader’s WIL** in place of their own. Lone foes must save when they’re **reduced to 0 HP**.
* Morale does not affect PCs.

## Hirelings

* Parties can recruit **hirelings** for their skills and aid.
* Create a hireling by choosing a role from the Marketplace, rolling **3d6** for each Attribute and **1d6** for HP, giving appropriate equipment, then rolling on the Character Traits tables to flesh them out.
* Alternatively, choose a background and name from Character Creation, then roll (or choose) for that background’s tables; roll Rations, Gold, Attributes, HP, and Age.

## Die of Fate

* Optionally roll **1d6** when an outcome is uncertain or to simulate randomness.
* **4–6** generally favors the PCs; **1–3** usually favors the world.

## Combat

### Rounds

* A **Round** is roughly ten seconds of in-game time and proceeds with each side taking turns. Each round starts with any PC able to act, followed by their opponents. **Results resolve simultaneously.**
* During the **first round of combat**, each PC must make a **DEX save** to act. Special circumstances, abilities, items, or skills may negate this. PCs who fail **lose their turn** for round one.
* Then opponents act; the next round begins with PCs, and so on until one side is defeated or flees.

### Actions

On their turn, a character may move up to **40 ft** and take **one action** (cast a spell, attack, move again, interact, etc.). PCs declare actions before dice are rolled. If an action is risky, the Warden calls for saves.

### Attacking & Damage

* **Attacks automatically hit**; roll your weapon’s damage, subtract **Armor**, then apply the remainder to **HP**.
* If multiple attackers target the same foe, roll all damage dice and **keep the highest single result**. All actions are declared before resolution.
* If an attack would reduce a PC’s HP **exactly to 0**, roll on **[Scars](#scars-table)**.

### Attack Modifiers

* **Impaired**: If fighting from a position of weakness (cover, bound hands, chaos), roll **1d4** damage regardless of weapon. Unarmed attacks are **d4**.
* **Enhanced**: If fighting from a position of clear advantage (helpless foe, ambush, daring maneuver), roll **1d12** damage instead of the normal die.
* **Blast**: Affects all targets in an area; roll separately for each. If unsure how many targets can be affected, roll the related damage die for a count.
* **Two-Weapon**: Roll both damage dice and keep the highest (e.g., **d8+d8**).

### Critical Damage

* Damage that reduces HP **below 0** is subtracted from **STR** by the amount remaining. The target must immediately make a **STR save** (using the new STR) to avoid **Critical Damage**.

  * **Failure**: the target is down, bleeding out, and dies within an hour without aid.
  * **Success**: the target stays in the fight (with reduced STR) but must keep saving if further damage reaches STR again.
* **Bandages** immediately stop bleeding and restore **+1 STR**.
* NPCs/monsters that fail a Critical Damage save are typically **dead** (Warden’s discretion). Some enemies may trigger special effects when a target fails a Critical Damage save.

### Attribute Loss

* Damage outside combat typically reduces an Attribute (often **STR**).
* **STR 0** = death. **DEX 0** = paralyzed. **WIL 0** = delirious.
* Complete **DEX** or **WIL** loss renders the character unable to act until restored by extended rest or extraordinary means.

### Character Death

* When a character dies, the player creates a new character or takes control of a hireling, joining the party immediately to minimize downtime.

### Detachments

* Large groups of similar combatants function as a single **Detachment**. When a detachment takes **Critical Damage**, it routs or is significantly weakened. At **0 STR**, it is destroyed.
* Attacks **against** detachments by individuals are **Impaired** (except **Blast**). Attacks **by** detachments against individuals are **Enhanced** and deal **Blast** damage.

### Retreat

* Running from danger requires a successful **DEX save** and a safe destination.

### Ranged Attacks

* Ranged weapons can target any enemy within clear sight (close dungeon ranges). Attacks against **especially distant** targets are **Impaired**.
* Ammunition isn’t tracked unless specified.

## Scars

If damage would reduce a PC’s HP to **exactly 0**, consult the table based on **HP lost in that attack** (e.g., from 3 HP to 0 → entry #3).

### Scars Table

| **HP Lost** | **Result**                                                                                                                                   |
| -- | -- |
| 1           | **Lasting Scar**: Roll 1d6. 1 Neck, 2 Hands, 3 Eye, 4 Chest, 5 Legs, 6 Ear. Roll 1d6; if the total exceeds your max HP, take the new result. |
| 2           | **Rattling Blow**: You’re shaken; describe how you refocus. Roll 1d6; if higher than your max HP, take it as new max.                        |
| 3           | **Walloped**: You’re sent flying; you’re **Deprived** until resting a few hours. Then roll 1d6 and add to max HP.                            |
| 4           | **Broken Limb**: Roll 1d6 (1–2 Leg, 3–4 Arm, 5 Rib, 6 Skull). Once mended, roll 2d6; if higher than max HP, take it.                         |
| 5           | **Diseased**: Gross infection. When you recover, roll 2d6; if higher than max HP, take it.                                                   |
| 6           | **Head Wound**: Roll 1d6 (1–2 STR, 3–4 DEX, 5–6 WIL). Roll 3d6; if higher than current attribute, take it.                                   |
| 7           | **Hamstrung**: You can barely move until serious help and rest. After recovery, roll 3d6; if higher than max DEX, take it.                   |
| 8           | **Deafened**: Cannot hear until extraordinary aid. Make a WIL save; if you pass, increase max WIL by 1d4.                                    |
| 9           | **Re-brained**: A hidden psyche shifts. Roll 3d6; if higher than max WIL, take it.                                                           |
| 10          | **Sundered**: An appendage is ruined (Warden chooses). Make a WIL save; if you pass, increase max WIL by 1d6.                                |
| 11          | **Mortal Wound**: You are Deprived and out of action. You die in one hour unless healed. Upon recovery, roll 2d6; take as new max HP.        |
| 12          | **Doomed**: If your next Critical Damage save fails, you die horribly. If it succeeds, roll 3d6; if higher than max HP, take it.             |

## Magic

### Spellbooks

* **Spellbooks** contain a single spell and take **one slot**. They cannot be easily transcribed or created; they’re recovered from tombs, dungeons, and manors.
* Spellbooks often have unusual properties (moon-ink, whispers, intelligent margins) and attract attention.

### Casting Spells

* **Anyone** can cast by holding a Spellbook in **both hands** and reading aloud; then **add 1 Fatigue**.
* With **time and safety**, a spell can be **enhanced** (more targets, greater effect) at **no additional cost**.
* If **Deprived** or in **danger** (e.g., combat), the Warden may require a **WIL save** to avoid ill effects. On failure, consequences match the intended scale: extra **Fatigue**, destroyed Spellbook, injury, even death.

### Scrolls

* **Petty**, **single-use**, **no Fatigue**, crumbles after use.

### Relics

* Items imbued with magical power. Do **not** cause Fatigue. Usually limited uses and a **Recharge** condition.

## Dungeon Exploration

### The Basics

* The dungeon exploration cycle (see below) is divided into a series of **Turns**, **Actions**, and their consequences.
* On their **turn**, a character can move a distance equal to their torchlight’s perimeter (**~40 ft**) and perform one **action**. Players can use their **action** to move up to **three times** that distance, though that will increase the chance of triggering a roll on the **[Dungeon Events](#dungeon-events)** table.
* The **Warden** should present obvious information about an area and its dangers freely and at no cost. Moving quickly or without caution may increase the chance of a wandering monster, springing a trap, or triggering **Dungeon Events**.

> “Dungeon” can be any dangerous locale: mansions, farmhouses, ruins, ships, temples, etc.

### Dungeon Exploration Cycle

1. The **Warden** describes surroundings and any immediate dangers (combat, traps, surprises). Players declare movement and **actions**.
2. The Warden resolves **actions** simultaneously, including any already in progress. The **Die of Fate** is useful when in doubt.
3. Players record resource loss and new conditions (item use, **Deprivation**, etc.). The cycle repeats. If appropriate, the **Warden** rolls on **[Dungeon Events](#dungeon-events)**. Use common sense when interpreting results.

### Dungeon Events

Roll when the party:

* Spends more than one cycle in a single room/location
* Moves quickly or haphazardly
* Enters a new area/level/zone
* Creates a loud disturbance

|  d6 |      Result     | Effect                                                                              |
| :-: | :-: | :- |
|  1  |  **Encounter**  | Roll on a local encounter table; may be **hostile** (see **Reactions**).            |
|  2  |     **Sign**    | Clue/spoor/track, abandoned lair, scent, victim, etc.                               |
|  3  | **Environment** | Conditions shift or escalate (water rises, ceilings crumble, rituals progress).     |
|  4  |     **Loss**    | Torches blown out, ongoing spell fizzles, etc. Resolve before proceeding.           |
|  5  |  **Exhaustion** | Party must rest (trigger another event roll), add **Fatigue**, or consume a ration. |
|  6  |    **Quiet**    | The party is left alone—for now.                                                    |

### Actions

* **Actions** include *searching for traps*, *forcing a door*, *listening*, *disarming*, *engaging in combat*, *casting a spell*, *dodging a trap*, *running away*, *resting*, etc.
* Some actions have special rules (below) or take multiple **turns**.
* Loud/noticeable actions may trigger an **Encounter**.

#### Searching

* Spend a **turn** to exhaustively search **one** object or location, revealing hidden treasure, traps, secret doors, etc.
* Larger or complex spaces may take multiple **turns**.
* Searching first is safer—but it costs **time**.

#### Resting

* Spend a **turn** to **restore all HP**.
* Requires light and a **safe location**. Present or oncoming danger makes resting impossible.
* **Resting does not clear Fatigue**; it is impossible to safely Make Camp in a dungeon.

## Panic

* A character surrounded by enemies, plunged into darkness, or facing a greatest fear may suffer **panic**. Typically, a **WIL save** is required to avoid becoming **panicked**.
* A **panicked** character may spend their **action** to save (WIL) and recover.
* A **panicked** character has **0 HP**, does not act in the **first round of combat**, and all of their attacks are **Impaired**.

### Dungeon Elements

#### Light

* Torches illuminate **~40 ft** clearly; beyond that, only dim shapes.
* A torch can be lit **3** times before it’s spent. A lantern can be relit **6** times per oil can but uses more slots.
* Characters without light may suffer **panic** until conditions improve.

#### Doors

* Doors may be locked, stuck, or blocked. Characters can force, wedge, or work around doors with appropriate means (spikes, glue, leverage) or raw ability.
* **Marching order** determines who suffers whatever lies beyond.
* Careful observation (listening, smelling) can reveal signs through doors and walls.

#### Traps

* Cautious characters should be given information allowing them to **avoid** traps. Unwary characters trigger traps per the fiction, or else on **2-in-6**.
* **Searching** usually detects traps.
* Trap damage typically applies to **Attributes** (often **STR** or **DEX**), **not** HP. Armor reduces damage only when applicable (a shield won’t help vs noxious gas).

## Character Creation

### Attributes, Hit Protection, and Traits

* Roll for your Characters’ **Attributes** and **Hit Protection**.
* Roll for the rest of your character’s [Background](#backgrounds).
* Finally, roll for your character’s **Age** (2d20+10).

### Attributes

* Player Characters have three Attributes: **Strength (STR)**, **Dexterity (DEX)**, and **Willpower (WIL)**.
* Roll **3d6** for each of your character’s Attributes, in order. You may then swap any two results.
* Attributes are not universal descriptors. A character with a low STR is not necessarily hopelessly weak; they can still attempt to lift a heavy door or survive a deadly fight—their **risk** is simply higher.

### Hit Protection

* Roll **1d6** to determine your PC’s starting **Hit Protection** (HP), which reflects their ability to avoid damage in combat. It does **not** indicate a character’s health or fortitude, nor do they lose it for very long. See [Healing & Recovery](#healing--recovery).
* If an attack would take a PC’s HP **exactly** to 0, the player must roll on the [**Scars**](#scars-table) table.

### Inventory

* Characters have **10** inventory slots but can only carry **4–5** items comfortably without the help of bags, backpacks, horses, carts, etc.
* Each PC starts with a **Backpack** that can hold up to **6** slots of items or **Fatigue**. Carts (pulled with both hands), horses, or mules meaningfully increase carrying capacity. **Hirelings** can also be paid to carry equipment.
* Inventory is abstract and dependent on the fiction as adjudicated by the Warden. Anyone carrying a **full inventory** (all 10 slots) is reduced to **0 HP**. A character cannot fill more than ten slots.

#### Inventory Slots

* Most items take up **one** slot unless otherwise indicated.
* *Petty* items do **not** take up any slots. *Bulky* items take up **two** slots.
* A bag of coins worth **<100gp** is *petty* and does not occupy a slot.

## Backgrounds

### Fighter

#### Starting Gear

* 3d6 Gold Pieces
* Rations (3 uses)
* **Torches** (3 uses)
* **Sword** (d8)
* **Shield** (+1 Armor)
* **Gambeson** (+1 Armor)
* **Bandages** (3 uses)
* Token from a fallen comrade (*petty*)

### Thief

#### Starting Gear

* 3d6 Gold Pieces
* Rations (3 uses)
* **Lantern**
* **Oil Can (6 uses)**
* **Dagger** (d6)
* **Sling** (d6)
* **Thieving Tools** (Lockpick, Metal File, etc.)
* **Rope (25ft)**
* Black Hood (_petty_)

### Magic-User

#### Starting Gear

* 3d6 Gold Pieces
* Rations (3 uses)
* **Spellbook** (roll d100 on [Spellbooks](#spellbooks-1) table)
* **Dagger** (d6)
* **Torches** (3 uses)
* **Chalk (*petty*)** and **Parchment (3 uses)**
* **Robes** (_petty__)

### Cleric

#### Starting Gear

* 3d6 Gold Pieces
* Rations (3 uses)
* **Mace** (d8)
* **Holy Symbol (*petty*)**
* **Gambeson** (1 Armor)
* **Bandages** (3 uses)
* **Vestments** (_petty_)


## Spellbooks

|         |                       |                                                                                                                                                                                                                                                                                              |
| ------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**   | **Adhere**            | An object is covered in extremely sticky slime. _Adjacent objects stick to the book with great force._                                                                                                                                                                                       |
| **2**   | **Anchor**            | A strong wire sprouts from your arms, affixing itself to two points within 50ft on each side. _If a rope is pulled through the iron loop on its spine, it becomes as heavy as an elephant._                                                                                                  |
| **3**   | **Animate Object**    | An object obeys your commands as best it can. _Moldable like clay. Childish laughter sprouts from its pages._                                                                                                                                                                                |
| **4**   | **Anthropomorphize**  | An animal either gains human intelligence or human appearance for one day. _Whimpers, purrs and growls depending on its treatment._                                                                                                                                                          |
| **5**   | **Arcane Eye**        | You can see through a magical floating eyeball that flies around at your command. _Needs a spritz of water to open._                                                                                                                                                                         |
| **6**   | **Astral Prison**     | An object is frozen in time and space within an invulnerable crystal shell. _Silent, abstract, faces scream in anguish within._                                                                                                                                                              |
| **7**   | **Attract**           | Two objects are strongly magnetically attracted to each other if they come within 10 feet. _Nearby compasses spin uselessly._                                                                                                                                                                |
| **8**   | **Auditory Illusion** | You create illusory sounds that seem to come from a direction of your choice. _Produces random and occasionally inopportune sounds throughout the day_.                                                                                                                                      |
| **9**   | **Babble**            | A creature must loudly and clearly repeat everything you think. It is otherwise mute. _When the text is read aloud, the words of others become unintelligible._                                                                                                                              |
| **10**  | **Bait Flower**       | A plant sprouts from the ground that emanates the smell of decaying flesh. _Attracts flies._                                                                                                                                                                                                 |
| **11**  | **Beast Form**        | You and your possessions transform into a mundane animal. _Covered in thick fur, its edges lined with small teeth._                                                                                                                                                                          |
| **12**  | **Befuddle**          | A creature of your choice is unable to form new short-term memories for the duration of the spell. _Its contents shift and change each time it is opened._                                                                                                                                   |
| **13**  | **Body Swap**         | You switch bodies with a creature you touch. If one body dies, the other dies as well. _The front cover shows an image of the last creature to read it._                                                                                                                                     |
| **14**  | **Charm**             | A creature you can see treats you as a friend. _Warm to the touch, and smells of roses._                                                                                                                                                                                                     |
| **15**  | **Command**           | A target obeys a single three-word command that does not cause it harm. _Grows thinner over time, until finally disappearing forever._                                                                                                                                                       |
| **16**  | **Comprehend**        | You become fluent in all languages for a short while. _Drips letters, staining whatever it touches._                                                                                                                                                                                         |
| **17**  | **Cone of Foam**      | Dense foam sprays from your hand, coating the target. _Spongy and moist with a soapy residue._                                                                                                                                                                                               |
| **18**  | **Control Plants**    | Nearby plants and trees obey you and gain the ability to move at a slow pace. _Leaves grow along the spine, and it smells faintly of decay._                                                                                                                                                 |
| **19**  | **Control Weather**   | You may alter the type of weather at will, but you do not otherwise control it. _Highly resistant to fire and water damage._                                                                                                                                                                 |
| **20**  | **Cure Wounds**       | Restore 1d4 STR per day to a creature you can touch. _Smells of vinegar and thyme. Turns red after use._                                                                                                                                                                                     |
| **21**  | **Deafen**            | All nearby creatures are deafened. _Nearby instruments occasionally sound off, as if in protest._                                                                                                                                                                                            |
| **22**  | **Detect Magic**      | You can see or hear nearby magical auras. _Becomes warm to the touch if magic is used nearby._                                                                                                                                                                                               |
| **23**  | **Disassemble**       | Any of your body parts may be detached and reattached at will, without causing pain or damage. You can still control them. _Regenerates any torn or defaced pages._                                                                                                                          |
| **24**  | **Disguise**          | You may alter the appearance of one character at will as long as they remain humanoid. Attempts to duplicate other characters will seem uncanny. _The surface makes a perfect mirror._                                                                                                       |
| **25**  | **Displace**          | An object appears to be up to 15ft from its actual position. _Bits of string, clothing, and leaves are sometimes stuffed inside._                                                                                                                                                            |
| **26**  | **Earthquake**        | The ground begins shaking violently. Structures may be damaged or collapse. _Sand dribbles from the corners, seemingly without stop._                                                                                                                                                        |
| **27**  | **Elasticity**        | Your body can stretch up to 10ft. _Smells of taffy, and is very flexible._                                                                                                                                                                                                                   |
| **28**  | **Elemental Wall**    | A straight wall of ice or fire 50ft long and 10ft high rises from the ground. _Skin and warmer substances stick to it after use._                                                                                                                                                            |
| **29**  | **Filch**             | A visible item teleports to your hands. _An ally's prized possession may occasionally be found tucked between its covers_.                                                                                                                                                                   |
| **30**  | **Fish Lung**         | A target can breathe underwater until they surface again. _Smells strongly of the sea. Attracts wild animals._                                                                                                                                                                               |
| **31**  | **Flare**             | A bright ball of energy fires a trail of light into the sky, revealing your location to friend or foe. _Faintly glows in complete darkness_.                                                                                                                                                 |
| **32**  | **Fog Cloud**         | A dense fog spreads out from you. _When submersed in water, the book eventually turns all the liquid to vapor._                                                                                                                                                                              |
| **33**  | **Frenzy**            | A nearby creature erupts in a frenzy of violence. _Rough, sandpaper cover that destroys any book it touches._                                                                                                                                                                                |
| **34**  | **Gate**              | A portal to a random plane opens. _A large hole is carved into the center, ending in a void. Items dropped within are never seen again_.                                                                                                                                                     |
| **35**  | **Gravity Shift**     | You can change the direction of gravity, but only for yourself. _Attaches itself to the largest object nearby._                                                                                                                                                                              |
| **36**  | **Greed**             | A creature develops the overwhelming urge to possess a visible item of your choice. _The cover changes depending on the owner, subtly hinting at their deepest desires._                                                                                                                     |
| **37**  | **Haste**             | Your movement speed is tripled. _Pages flip wildly while open. Can cause paper cuts._                                                                                                                                                                                                        |
| **38**  | **Hatred**            | A creature develops a deep hatred of another creature or group and wishes to destroy them. _Long term exposure to the book can cause suspicion, paranoia and distrust of others._                                                                                                            |
| **39**  | **Hear Whispers**     | You can hear faint sounds clearly. _The reader's voice is amplified for a short period of time afterwards._                                                                                                                                             |
| **40**  | **Hover**             | An object hovers, frictionless, 2ft above the ground. It can hold up to one humanoid. _Floats if dropped._                                                                                                                                                                                   |
| **41**  | **Hypnotize**         | A creature enters a trance and will truthfully answer one yes or no question you ask it. _Eye-catching, swirling spirals don its covers._                                                                                                                                                    |
| **42**  | **Icy Touch**         | A thick ice layer spreads across a touched surface, up to 10ft in radius. _Gloves required. Nonflammable_.                                                                                                                                                                                   |
| **43**  | **Identify Owner**    | Letters appear over the object you touch, spelling out the name of the object’s owners, if there are any. _The book's interior lists the name of its previous owner._                                                                                                                        |
| **44**  | **Illuminate**        | A floating light moves as you command. _When held in light, the pages become a prism of vibrant rainbows._                                                                                                                                                                                   |
| **45**  | **Invisible Tether**  | Two objects within 10ft of each other cannot be moved more than 10ft apart. _Its pages are not attached by glue or thread, yet stay together nonetheless._                                                                                                                                   |
| **46**  | **Knock**             | A nearby mundane or magical lock unlocks loudly. _Locked. A new owner "produces" the key after their next meal._                                                                                                                                                                             |
| **47**  | **Leap**              | You jump up to 10ft high, once. _When thrown, it just keeps going._                                                                                                                                                                                                                          |
| **48**  | **Liquid Air**        | The air around you becomes swimmable. _Floats of its own volition, bouncing off of whatever it touches._                                                                                                                                                                                     |
| **49**  | **Magic Dampener**    | All nearby magical effects have their effectiveness halved. _Relics within 100ft of the spellbook cannot be recharged._                                                                                                                                                                      |
| **50**  | **Manse**             | A sturdy, furnished cottage appears for hours. You can permit and forbid entry to it at will. _If left inside, both the book and the cottage vanish forever._                                                                                                                                |
| **51**  | **Marble Craze**      | Your pockets are full of marbles and will refill every 30 seconds. _When jostled, makes a playful rattling sound._                                                                                                                                                                           |
| **52**  | **Masquerade**        | A character's appearance and voice becomes identical to those of a character you touch. _Extended use causes the owner to develop unconscious yet noticeable tics._                                                                                                                          |
| **53**  | **Miniaturize**       | A creature you touch is shrunk down to the size of a mouse. _The text is ludicrously, comically large._                                                                                                                                                                                      |
| **54**  | **Mirror Image**      | An illusory duplicate of yourself appears and is under your control. _Over time, the owner begins to question who is the original, and who is the duplicate._                                                                                                                                |
| **55**  | **Mirrorwalk**        | A mirror becomes a gateway to another mirror that you looked into today. _Will not open unless the owner politely knocks on the cover._                                                                                                                                                      |
| **56**  | **Multiarm**          | You temporarily gain an extra arm. _After use, the caster is wracked with phantom limb syndrome for a day._                                                                                                                                                                                  |
| **57**  | **Night Sphere**      | A 50ft-wide sphere of darkness displaying the night sky appears before you. _Displays a prominent constellation on its cover_.                                                                                                                                                               |
| **58**  | **Objectify**         | You become any inanimate object between the size of a grand piano and an apple. _The owner experiences intense pareidolia for days after use._                                                                                                                                               |
| **59**  | **Ooze Form**         | You become a living jelly. _Slowly drips an acid that eventually eats away anything it touches._                                                                                                                                                                                             |
| **60**  | **Pacify**            | A creature near you has an aversion to violence. _Smells of jasmine and incense. Attracts children._                                                                                                                                                                                         |
| **61**  | **Passage**           | Creates a temporary path through wood, stone or brick. _An object dropped on top of the book inevitably falls through the other side._                                                                                                                                                       |
| **62**  | **Phobia**            | A nearby creature becomes terrified of an object of your choice. _Over time, haunting, abstract art begins to fill its pages._                                                                                                                                                               |
| **63**  | **Pit**               | A pit 10ft wide and 10ft deep opens in the ground. _A standard piton can be safely stored in its spine_.                                                                                                                                                                                     |
| **64**  | **Primal Surge**      | A creature rapidly evolves into a future version of its species. _The owner is haunted by strange visions of their own ancestors._                                                                                                                                                           |
| **65**  | **Push/Pull**         | An object of any size is pulled directly towards you or pushed directly away from you with the strength of one man. _Any force against the book is comically amplified._                                                                                                                     |
| **66**  | **Raise Dead**        | A skeleton rises from the ground to serve you. They are incredibly stupid and can only obey simple orders. _The owner becomes more and more fascinated with bones after each use._                                                                                                           |
| **67**  | **Raise Spirit**      | The spirit of a nearby corpse manifests and will answer 1 question. _The answers (but not their questions) are forever inscribed in its pages._                                                                                                                                              |
| **68**  | **Read Mind**         | You can hear the surface thoughts of nearby creatures. _Long-term possession can cause the reader to mistake the thoughts of others as their own._                                                                                                                                           |
| **69**  | **Repel**             | Two objects are strongly magnetically repelled from each other within 10 feet. _Closed by two powerful straps that spring open at inopportune times._                                                                                                                                        |
| **70**  | **Scry**              | You can see through the eyes of a creature you touched earlier today. _The owner's eyes turn milky-white for an hour after use._                                                                                                                                                             |
| **71**  | **Sculpt Elements**   | Inanimate material behaves like clay in your hands. _Slowly decays on contact with wood or cloth. Bury in dirt or submerge in water to refresh._                                                                                                                                             |
| **72**  | **Sense**             | Choose one kind of object (key, gold, arrow, jug, etc). You can sense the nearest example. _The book's previous owner is always aware of the book's current location._                                                                                                                       |
| **73**  | **Shield**            | A creature you touch is protected from mundane attacks for one minute. _Bound in rusty ring-mail and is quite heavy. If held, provides +1 Armor._                                                                                                                                            |
| **74**  | **Shroud**            | A creature you touch is invisible until they move. _Invisible to any but the book's current owner._                                                                                                                                                                                          |
| **75**  | **Shuffle**           | Two creatures you can see instantly switch places. _If stolen but not yet read, it reappears wherever its owner last left it._                                                                                                                                                             |
| **76**  | **Skillful Repair**   | You make minor repairs to a nonliving object. _Sewn from the vellum of one hundred books, no two pages are alike._                                                                                                                                                                           |
| **77**  | **Sleep**             | A creature you can see falls into a light sleep. _Soft as a pillow, but yields only fitful sleep._                                                                                                                                                                                           |
| **78**  | **Slick**             | Every surface in a 30ft radius becomes extremely slippery. _Gloves are required for handling, lest the book is dropped in a most comical fashion._                                                                                                                                           |
| **79**  | **Smoke Form**        | Your body becomes a living smoke that you can control. _Smells of campfire. The pages cannot be burnt, but are very sensitive to moisture._                                                                                                                                                  |
| **80**  | **Sniff**             | You can smell even the faintest traces of scents. _Expresses a strong odor detectable only by its owner._                                                                                                                                                                                    |
| **81**  | **Snuff**             | The source of any mundane light you can see is instantly snuffed out. _If left in one place for long periods, nearby light sources eventually dim, then finally go out._                                                                                                                     |
| **82**  | **Sort**              | Inanimate items sort themselves according to categories you set. _Rights itself when dropped or thrown._                                                                                                                                                                                     |
| **83**  | **Spellsaw**          | A whirling blade flies from your chest, clearing any plant material in its way. It is otherwise harmless. _Wrapped in stained leather, it should be oiled at least once a month_.                                                                                                            |
| **84**  | **Spider Climb**      | You can climb surfaces like a spider. _New cobwebs must be pushed aside prior to each use. They are hard to remove._                                                                                                                                                                        |
| **85**  | **Swarm**             | You become a swarm of crows, rats, or piranhas. You can only be harmed by _blast_ attacks. _Easily broken into a dozen distinct parts that slowly move towards one another over time._                                                                                                       |
| **86**  | **Target Lure**       | An object you touch becomes the target of any nearby spell. _Attracts all manner of magical creatures, spell leaks, and scrying._                                                                                                                                                            |
| **87**  | **Telekinesis**       | You may mentally 1 move item under 60lbs. _The owner can summon the book through mental command alone (WIL save or become deprived afterwards)._                                                                                                                                             |
| **88**  | **Telepathy**         | Two creatures can hear each other’s thoughts, no matter how far apart. _The holder can hear (but not respond) to the thoughts of whoever last possessed it, and vice versa._                                                                                                                 |
| **89**  | **Teleport**          | An object or person you can see is transported from one place to another in a 50ft radius. _Can be destroyed to create a portal to another dimension._                                                                                                                                       |
| **90**  | **Thicket**           | A thicket of trees and dense brush up to 50ft wide suddenly sprouts up. _Wrapped in vines that must be destroyed again with each use._                                                                                                                                                       |
| **91**  | **Time Control**      | Time in a 50ft bubble slows down or increases by 10% for 30 seconds. _Alternates its appearance as either impossibly old or freshly written.                                                                                                                                              |
| **92**  | **True Sight**        | You see through all nearby illusions. _Cannot be concealed by magic, and sticks out like a sore thumb._                                                                                                                                                                      |
| **93**  | **Upwell**            | A spring of seawater appears. _Hardened leather bindings caked in salt and living barnacles.._                                                                                                                                                                                               |
| **94**  | **Vision**            | You completely control what a creature sees. _An unnerving, lidless eye graces the front cover._                                                                                                                                                                                             |
| **95**  | **Visual Illusion**   | A silent, immobile, room-sized illusion of your choice appears. _Filled with rich, colorful pages very much like a children's bedtime story._                                                                                                                                                |
| **96**  | **Ward**              | A silver circle 50ft across appears on the ground. Choose one species that cannot cross it. _The covers are decorated with bizarre, otherworldly creatures with thousands of eyes._                                                                                                          |
| **97**  | **Web**               | Your wrists shoot thick webbing. _The text is alien, yet somehow intelligible, for it is the language of dreams._                                                                                                                                                                            |
| **98**  | **Widget**            | A primitive version of a drawn tool or item appears before you and disappears after a short time. _Smells of iron and rust, sweat and effort. Faint sounds of harsh labor emanate from deep within its pages._                                                                               |
| **99**  | **Wizard Mark**       | Your finger can shoot a stream of ulfire-colored paint. This paint is only visible to you and can be seen at any distance, even through solid objects. _Inside the front cover is a small pocket containing a thin pad of paper, listing the name and date of death of all previous owners._ |
| **100** | **X-Ray Vision**      | You can see through walls, dirt, clothing, etc. _Long-term exposure can cause hair loss, blurry vision, and fatigue._                                                                                                                                                                        |
