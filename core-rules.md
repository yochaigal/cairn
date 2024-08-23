---
layout: default
title: Core Rules
nav_order: 940

---

# Core Rules

<details close markdown="block">
  <summary id="index">
    Table of contents
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Attributes

Each of the three **Attributes** are used in different circumstances. (See **Saves**, below.)

- **Strength (STR)**: Used for saves requiring physical power, like lifting gates, bending bars, resisting poison, etc.
- **Dexterity (DEX)**: Used for saves requiring poise, speed, reflexes, wits, coolness, sneaking, balancing, etc.
- **Willpower (WIL)**: Used for saves to persuade, deceive, interrogate, intimidate, charm, provoke, manipulate spells, etc.

## Saves

- A save is a roll to avoid negative outcomes from risky choices. Characters roll a d20 and compare the results to the appropriate attribute. If they roll equal to or under that attribute, they succeed. Otherwise, they fail. A 1 is always a success, and a 20 is always a failure.
- If two opponents are each trying to overcome the other, whoever is most at risk should save.
- If two characters need to take an action together, whoever is most at risk should save (usually the character with the lowest relevant Attribute).

## Healing & Recovery

- Resting for a few moments and having a drink of water restores lost HP but may leave the party exposed. Bandages can stabilize a character that has taken critical damage.
- Attribute loss (see **Critical Damage**) can usually be restored with a week's rest, facilitated by a healer or other appropriate source of expertise. 
- Some healing services are free, while magical or more expedient means of recovery may come at a cost. 

## Deprivation & Fatigue

- A PC that lacks a crucial need (such as food or rest) is **Deprived**. Anyone **Deprived** for more than a day adds **Fatigue** to their inventory, one for each day. A **Deprived** PC cannot recover HP, Attributes, or item slots from **Fatigue**.
- A PC may also be forced to add **Fatigue** after casting spells or due to events occurring in the fiction. Each Fatigue occupies one slot and lasts until the PC is able to recuperate (such as with a full night’s rest in a safe spot).
- If a character is forced to add **Fatigue** to their inventory but they have no free slots, they must drop an item from their inventory.

## Armor

- Before calculating damage to HP, subtract the target's **Armor** value from the result of damage rolls. 
- Shields and similar armor provide a bonus defense (e.g. +1 Armor), but only while the item is held or worn. Some may also provide additional benefits, depending on the fiction.
- A PC, NPC, or monster cannot have more than 3 Armor.  

## Reactions

When the PCs encounter an NPC whose reaction to the party is not obvious, the Warden may roll 2d6 and consult the following table:

|         |      |         |      |         |
| :-----: | :--: | :-----: | :--: | :-----: |
|    2    | 3-5  |   6-8   | 9-11 |   12    |
| Hostile | Wary | Curious | Kind | Helpful |

## Morale

- Enemies must pass a WIL save to avoid fleeing when they take their first casualty and again when they lose half their number. 
- Some groups may use their leader's WIL in place of their own. Lone foes must save when they're reduced to 0 HP. 
- Morale does not affect PCs.

## Die of Fate  

- Optionally, roll 1d6 whenever the outcome of an event is uncertain or to simulate an element of randomness and chance.
- A roll of 4 or more generally favors the PCs, while a roll of 3 or under usually means bad luck for the PCs.

## Combat

### Rounds

- A **Round** is roughly ten seconds of in-game time and and proceeds with each side taking turns. Each round starts with any PC that is able to act, followed by their opponents. _The result of each side's actions occur simultaneously_. 
- During the _first round of combat_, each PC must make a DEX save in order to act. Special circumstances, abilities, items, or skills may negate this requirement. PCs that fail their save _lose their turn_ for this round.
- Their opponents then take their turn, and the first round ends. The next round begins with the PCs taking their turn, followed by their opponents, and so on until combat has ended with one side defeated or fled.

### Actions

On their turn, a character may move up to 40ft and take up to one action. This may be casting a spell, attacking, moving for a second time, or some other reasonable action. Each round, the PCs declare what they are doing before dice are rolled. If a character attempts something risky, the Warden calls for a save for appropriate players or NPCs. 

### Attacking & Damage

- The attacker rolls their weapon die and subtracts the target's armor, then deals the remaining total to their opponent's HP. Attacks in combat automatically hit.
- If multiple attackers target the same foe, roll all damage dice and keep the single highest result. All actions are declared before being resolved.
- If an attack would take a PC's HP exactly to 0, refer to the [Scars](#scars-table) table to see how they are uniquely impacted.

Weapons have a damage die.

|     |                      |
| --- | -------------------- |
| d4  | **Impaired** attacks |
| d6  | **Small** weapons    |
| d8  | **Medium** weapons   |
| d10 | **Large** weapons    |
| d12 | **Enhanced** attacks |

Weapons also may have tags.

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| *Bulky*    | Takes 2 burdens and needs 2 hands                         |
| *Advanced* | Ignore non-advanced Armour                                |
| *Blast*    | Harms multiple opponents (roll damage die for the number) |

For ranges, use what is narratively appropriate.

Armours can be

|     |            |                                    |
| :-: | ---------- | ---------------------------------- |
|  1  | **Light**  | *Bulky*.                           |
|  2  | **Medium** | *Bulky*.                           |
|  3  | **Heavy**  | *Bulky*, noisy, reduced awareness. |
| +1  | **Shield** |                                    |
	
### Attack Modifiers

- If fighting from a position of weakness (such as through cover or with bound hands), the attack is _Impaired_, and the attacker must roll 1d4 damage regardless of the attacks damage die. Unarmed attacks always do d4 damage.
- If fighting from a position of advantage (such as against a helpless foe or through a daring maneuver), the attack is _Enhanced_, allowing the attacker to roll 1d12 damage instead of their normal die.
- Attacks with the _Blast_ quality affect all targets in the noted area, rolling separately for each affected character. This can be anything from explosions to a dragon’s breath or the impact of a meteorite. If unsure how many targets can be affected, _roll the related damage die for a result_.
- If attacking with two weapons at the same time, roll both damage dice and keep the single highest result (denoted with a plus symbol, e.g. d8+d8).

### Critical Damage

- Damage that reduces a target's HP below zero is subtracted _from their STR_ by the amount of damage remaining. The target must then immediately make a STR save to avoid taking **Critical Damage**, using their _new STR score_. On a success, the target is still in the fight (albeit with a lower STR score) and must continue to make critical damage saves when incurring damage.
- Any PC that suffers Critical Damage cannot do anything but crawl weakly, grasping for life. If given aid (such as bandages), they will stabilize. If left untreated, they die within the hour. NPCs and monsters that fail a Critical Damage save are considered dead, per the **Warden's** discretion. Additionally, some enemies will have special abilities or effects that are triggered when their target fails a critical damage save. 

### Attribute Loss

- If a PC takes damage outside of combat, they should instead receive damage to an Attribute, typically STR.
- If a PC's STR is reduced to 0, they die. If their DEX is reduced to 0, they are paralyzed. If their WIL is reduced to 0, they are delirious. Complete DEX and WIL loss renders the character unable to act until they are restored through extended rest or by extraordinary means.

### Character Death

- When a character dies, the player should create a new character or take control of a hireling. They immediately join the party in order to reduce downtime.

### Detachments

- Large groups of similar combatants fighting together are treated as a single _Detachment_. When a _detachment_ takes **Critical Damage**, it is routed or significantly weakened. When it reaches 0 STR, it is destroyed.
- Attacks against detachments by individuals are _impaired_ (excluding _blast_ damage). Attacks against individuals by detachments are _enhanced_ and deal _blast_ damage.

### Retreat

- Running away from a dire situation always requires a successful DEX save, as well as a safe destination to run to.

### Ranged Attacks

- Ranged weapons can target any enemy near enough to see the whites of their eyes. Attacks against especially distant targets are _Impaired_.
- Ammunition is not tracked unless otherwise specified. 

## Woe

If you are exposed to the primer, or take **Burn**, you suffer Primer infection.

Note:
The amount and frequency of how you deal Primer infection establishes the tone and pacing of your game.
It is a dial to control the amount of Primer your players encounter and how likely they are to change as a result.

|         |           |
| ------- | --------- |
| **d4**  | Glimpse   |
| **d6**  | Contact   |
| **d8**  | Ingestion |
| **d10** | Exposure  |
| **d12** | Engulfed  |

Infection damage reduces your HP but gives you an equal amount of STR and WILL (up to 18) until the end of the scene.
If reduced to exactly 0 HP, you get an infection emergent affloration (mutation), roll on scars table.
If reduced beyond 0 HP, you lose DEX.

## Scars

If damage to a PC would reduce their HP to exactly 0, look up the result on the table below based on the _amount of HP lost in the attack_. For example, if a PC went from 3 HP to 0 HP, they would look at entry #3 (Walloped). 

| HP Lost | Result                                                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | **Lasting Scar**: Roll 1d6. 1: Neck, 2: Hands, 3: Eye, 4: Chest, 5: Legs, 6: Ear. Roll 1d6. If the total is higher than your max **HP**, take the new result.                                |
| 2       | **Rattling Blow**: You’re disoriented and shaken. Describe how you refocus. Roll 1d6. If the total is higher than your max **HP**, take the new result.                                      |
| 3       | **Walloped**: You’re sent flying and land flat on your face, winded. You are deprived until you rest for a few hours.  Roll a **Background feat**. If new, you may learn it.                 |
| 4       | **Broken Limb**: Roll 1d6. 1-2: Leg, 3-4: Arm, 5: Rib, 6: Skull. Take 2 Burdens until mended. Roll a **Generic feat**. If new, you may learn it.                                            |
| 5       | **Diseased**: You’re afflicted with a gross disease. When you get over it, roll 2d6. If the total is higher than your max **HP**, take the new result.                                       |
| 6       | **Deafened**: You cannot hear anything until you find extraordinary aid. Regardless, roll 2d6. If the total is higher than your max **HP**, take the new result.                             |
| 7       | **Hamstrung**: You can barely move until you get serious help and rest. Roll a **feat** from your **Background**. If new, you may learn it.                                                  |
| 8       | **Sundered**: An appendage is torn off, crippled, or useless. Roll a **Background** (*any*), and then a **feat** from it. If new, you may learn it.                                          |
| 9       | **Re-wired**: Roll 1d6. 1-2: STR, 3-4: DEX, 5-6: WIL. Roll **2d8**. If the total is higher than your current **attribute**, take the new result.                                             |
| 10      | **Reorienting Head Wound**: Roll 1d6. 1-2: STR, 3-4: DEX, 5-6: WIL. Roll **3d6**. If the total is higher than your current **attribute**, take the new result.                               |
| 11      | **Mortal Wound**: You are deprived and out of action. You die in one hour unless healed. Upon recovery, roll **2d8 HP** and take it if higher.                                               |
| 12      | **Doomed**: Death seemed ever so close, but somehow you survived. If your next save against critical damage is a fail, you die horribly. If you pass, roll **3d6 HP** and take it if higher. |