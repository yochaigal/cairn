---
layout: default
title: Changelog
nav_order: 9000
---

# Changelog

<details close markdown="block">
  <summary id="index">
    Table of contents
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

#### v0.7.1b

**Goal of minor version**: Run an Odd Shot of Degenesis

- New:
	- New simplified landing page
	- Synced Characters and Rules with Cairn 2e
	- Added Backgrounds as module
		- imported 6 from Cairn 2e
		- added Spitalian from Degenesis
	- Added Fallout placeholder (not modularised yet)
- Chaged:
	- Attributes roll 2d6+3
- WIP:
	- Created GMing file
	- Exposed resources
	- Cosmology of Terra Campaigns 
- Under the hood:
	- Housekeeping to remove unnecessary folders from Cairn
	- Housekeeping to organise information and files
	- Merged updates from Cairn
	- Updated gemfiles for website generation
	- Modularised config file, using includes

#### v0.7.0

Changes the base framework from [Forged in the Dark](https://bladesinthedark.com/basics) to [Mark of the Odd](https://www.bastionland.com/2020/11/mark-of-odd-licence-and-srd.html?m=1).

#### v0.6x

Last version of **Terra System**.
Updates after v0.6.1c are only maintained on [Terra System](https://terra-campaigns.github.io/terraSystem/).

#### v0.6.1c

- New:
	- Implemented list of skills, and skill sub-system
	- Added character sheet in txt file
- Changed:
	- Conditions / Ego recover are triggered by Panic events
	- Started aligning advancements with -WN for conversion of Hostile
	- Changed archetypes based on CWN/SWN, they influence skill groups
	- Either use skills or add an attribute
	- Starting to expand new approach to Challenges
	- Improved sub system for Effect and applied it to initial list of weapons
	- Advancements: Dodger to *human* unarmed
	- Simplified weapon tags
	- Extended the weapons list based on new tags
	- Reorganised Challenges chapter
	- Reviewed challenge disposition and implemented Challenge morale
- Text and aesthetics:
	- Improvements on Taxonomy.

#### v0.6.0

- Merged back changes implemented on Degenesis game.
- New:
	- Design principles are made explicit in the appendix
	- Some examples are added
- Changed:
	- Skills are renamed to Attributes
	- Attributes are renamed to Saves
	- New approach to wounds (more gritty)
	- New approach to Ego and Grit recovery
	- Improved list of Advancements
	- Expanded and improved Equipment
	- Modified approach to Effect (modifier of roll, instead of minimum)
- Removed:
	- Simulations details
- Text and aesthetics:
	- New level of headings to align with game forks

#### v0.5.3a

- New:
	- Sayonara mechanic.
	- Magnitude table.
- Changed:
	- No Malaise on a roll of 1.
	- Taking a wound avoids one instance of damage.
	- Rate of advancement changed from x2 to x3.
	- Challenge text reworked for clarity.
- Text and aesthetics:
	- Improved text around Attributes and Saves.
	- Reorganised Wounds and Malaises in the same place.
	- Reference aesthetics in italic implemented for the remaining topics.
	- Reorganised Effect and Challenge headers.
	- Swapped section titles and text fonts.
- Fixed changelog sync and publish.
- Base version for Degenesis campaign.

#### v0.5.2

- New:
	- Maximum in Skills is 10d.
- Changed:
	- Specialist and Inept are now based on WuDu's implementation for Skills.
	- Malaises (from Wounds) are improved.
	- Advancements do not increase Grit in 1, minimally.
	- Renamed weak and strong Effects to Reduced and Increased.
- Removed:
	- Skill limits beyond 2d (only max Skill applies).
	- Montages.
- Text and aesthetics
	- Skills points now refer to dice (beta)
	- Corrected name of attributes where it was still wrong.
	- Reference aesthetics in italic implemented for: Archetype, Risky Actions and Making a Game.

#### v0.5.1

- Suggested that a cohesive group shall be created, before individual character creation.
- Reduced number of Skills per Attribute to 2.
- Implemented system for gathering experience.
- Specialist and inept advancements are based on Cepheus skills.
- Changed:
	- Changing `code` references to *italic*.
- Minor:
	- Added link for new character sheet.
	- Improved general texts
- Removed:
	- Since attributes are already simplified, removed the further simpler 3 attribute version.

#### v0.5.0

- Major revisions on system:
	- Attribute and Skills approach is now leveraging the [Forged in The Dark SRD](https://bladesinthedark.com/actions-attributes).
	- Grit (and Wounds) have been revised, while reorganised text for Ego, maintained statistics for both.
	- Re-wrote Advancements and Conditions to match changes of Attributes, Skills, Grit.
	- Brought back the Precision and Effect trade-off in a single roll (from v0.3x), with an improved approach
	- Reviewed Advancement statistics and approach
- New:
	- Character Sheet for download
	- Short Equipment section
	- Expanded the section for Making a Game
	- Wounds section
	- Copyright for FitD
- Removed:
	- Removed simulations from published book (for now)
	- Copyright for Trophy
- Text and aesthetics improvements:
	- Changed text font to match Character Sheet
	- Changed game concepts aesthetics to `code`.
	- Several text improvements due to changes required by system revision

#### v0.4.5

- Re-worked the HP/Wounds sub-system
- Made Skill list more specific
- Added Advancements and Conditions
- Simplified the level-up sub-system
- Text improvements

#### v0.4.4

- Added simulations to validate expected game mechanics statistics
- Aligned Challenges Disposition based on simulation
- Aligned HP and Ego based on simulation, and target compatibility with BLB
- Changed how HP and Attribute loss works
- Changed Attribute names
- Renamed Chance rolls to Risky Actions rolls
- New mechanic for gaining levels and improving skills
- New mechanic for Challenge Montages
- Added fortune die section
- Moved images to local references
- Text improvements:
	- Character creation summary
	- Attribute loss and skills
	- Effects, including complications

#### v0.4.3

- Redefined Attributes and Skills values (kept statistics)
- Several table aesthetics improvements
- Expanded description of Challenges and Weapons
- Simplified Advancement
- Improved Chances text
- Created this Changelog

#### v0.4.2

- Finalised book aesthetics.
- Aligned with target statistics (BLB).
- Featured now generic content for Archetypes, Advancements and Conditions to replace their placeholders.
- Polished text and fixes.
- Added Make a Game section.

#### v0.4.1

- Started improving book aesthetics.
- Concept SRD might be complete.

#### v0.4.0

- Selection of Success, Effect and counter in one single roll proven to be complicated at the table. Chance roll is now separated from Effect, dark dice consume Ego.
- Changed Attribute names.
- Play tested with Trophy Dark's Throne of Forest Queen scenario.

#### v0.3x

- Rolls converted from 2d6 + mod to xd6 dice pools. Choose one die for success and one die for Effect. Dark dice determine counter effect from Challenges.
- Playtest with Kult's Driver scenario, children and alone.
- Needs further simplification for fast playing.

#### v0.2x

- Simplified the challenge die to a target number. Game runs on d6s only.
- Playtest with children and alone.
- Maths and selection at table are still convoluted (and might work bad for Discord games).

#### v0.1x

- First version, where 3d6 + mod are rolled with a challenge die (d4 to d20). Player choose 2d6 + mod for success, 1d6 for effect.
- Playtest with children and alone and it felt convoluted.