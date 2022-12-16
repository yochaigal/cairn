---
layout: default
title: Setting
grand_parent: WIP
parent: 2e
nav_exclude: true
search_exclude: true
---

# Setting

### Summary
- A setting has a **Theme**, **Scale**, **Terrain**, **Details**, and **Factions**.
- A **Province** is a single, traversable setting. A **Domain** is one or more adjacent **Provinces** defined by the same ruler.
- Distance is measured in [**Watches**](/wip/2e/wilderness-exploration/#travel), assuming that the party travels by foot and on maintained roads.

> See [this page](/wip/2e/example-setting) for an example setting.

## Theme
Established facts about the setting. Good questions to answer: 
- How is magic in this world?
- What level of technology is it?
- How does religion function?
- Who are the PCs in the setting? What is their relative position with respect to those in power?
- What races & backgrounds exist, and are they playable by PCs?
- What linguistic and cultural flavor exists in the setting?

### Scale
- **Small**: A single **Province** whose central hub is typically a large village, no more than _four_ **Watches** from the furthest **Detail**.  
- **Medium**: 2-4 **Provinces** who share a central hub (typically a large town), no more than _eight_ **Watches** from the furthest **Detail**.
- **Large**: 5-10 **Provinces** who share a central hub (typically a large city), no more than _sixteen_ **Watches** from the furthest **Detail**.

## Provinces

### Creating a Province
1. On a flat sheet of paper, create a dot to signify the central hub (a village, town, or city) of the **Province**. Number it **1**. 
2. Create three more dots in a triangle with the central hub in the rough center. Each of these dots represents an additional **Detail** on the map. Number these as well, in the order you create them.
3. Connect two of the dots to the central hub, using solid lines to represent roads, dotted lines for trails, and double lines for rivers and tunnels. Connect the remaining dot to one of these paths, crossing it and continuing for a distance. 
4. Repeat step #2, orienting the triangle of dots in a different way than before. Number each dot.
5. Connect two of the new dots to _any_ path, numbering each as you go. Do not connect the final dot.
6. Create a new dot wherever paths cross, and wherever a new path ends. Number them as you go.

> You can use other shapes (squares, rectangles, circles, etc) to create dots instead. Try varying the distance between dots for each successive **Province**. You can repeat this process for any adjacent **Provinces**, connecting them by road, river, or range.  


### Adding Terrain
1. Roll on the [Hub Terrain](#hub-terrain) table to determine the central hub's terrain. Choose **one** terrain from the results. 
2. Roll on the [Near Terrain](#near-terrain) table to determine the terrain for any dots within _two_ hops of the central hub. Choose **one** terrain from the results for each.
3. Roll on the [Far Terrain](#far-terrain) for any dots that are _three_ or more hops from the central hub, as well as those not connected to any path. Choose **one** terrain from the results for each.
4. Drawn or indicate the terrain for each dot on the map.

#### Hub Terrain

|        |                                   |
| ------ | :-------------------------------: |
| **d6** |            **Terrain**            |
| **1**  | **Plains, grasslands, farmlands** |
| **2**  |    **Forests, jungle, swamp**     |
| **3**  |     **River, flooded, oasis**     |
| **4**  |   **Cliffs, beaches, caverns**    |
| **5**  |   **Hills, canyons, mountains**   |
| **6**  |    **Desert, wasteland, sea**     |

#### Near Terrain

|        |                                   |
| ------ | :-------------------------------: |
| **d8** |            **Terrain**            |
| **1**  | **Plains, grasslands, farmlands** |
| **2**  |    **Forests, jungle, swamp**     |
| **3**  |    **Forests, jungle, swamp**     |
| **4**  |   **Hills, canyons, mountains**   |
| **5**  |   **Hills, canyons, mountains**   |
| **6**  |     **River, flooded, oasis**     |
| **7**  |   **Cliffs, beaches, caverns**    |
| **8**  |    **Desert, wasteland, sea**     |

#### Far Terrain

|        |                                   |
| ------ | :-------------------------------: |
| **d8** |            **Terrain**            |
| **1**  | **Plains, grasslands, farmlands** |
| **2**  |    **Forests, jungle, swamp**     |
| **3**  |   **Hills, canyons, mountains**   |
| **4**  |   **Hills, canyons, mountains**   |
| **5**  |     **River, flooded, oasis**     |
| **6**  |   **Cliffs, beaches, caverns**    |
| **7**  |    **Desert, wasteland, sea**     |
| **8**  |    **Desert, wasteland, sea**     |

## Details
- Each dot on the map is one **Detail**. **Details** act as [**Points**](/wip/2e/wilderness-exploration/#points) according to the [**Wilderness Exploration**](/wip/2e/wilderness-exploration) rules.
- Locations in a **Province** are divided into three categories: **The Wilds**, **The Settled Lands**, and **The Underworld**.
- Keep in mind how many **Watches** it might take to travel to each **Detail**. 

### Adding Details
1. Generate features about the central hub of the **Province** (a village, town, or city) by rolling on the [Settlement Features](#settlement-features) table.
2. Generate features for each remaining dot by first rolling on the the [Detail Types](#detail-types) table, then on the associated table.
3. For any settlements rolled, roll on the [Settlement Features](#settlement-features) table as well.

#### Detail Types

|        |                 |
| ------ | :-------------: |
| **d6** | **Detail Type** |
| **1**  | **Settlement**  |
| **2**  |    **Ruins**    |
| **3**  |    **Lair**     |
| **4**  |   **Hazard**    |
| **5**  |  **Landmark**   |
| **6**  |   **Special**   |

#### Settlements

|        |                |
| ------ | :------------: |
| **d6** | **Settlement** |
| **1**  |  **Village**   |
| **2**  |    **Town**    |
| **3**  |    **City**    |
| **4**  | **Stronghold** |
| **5**  | **Sanctuary**  |
| **6**  |   **Prison**   |

> Roll on the [Settlement Features](#settlement-features) table below.

##### Settlement Features

|        |                         |
| ------ | :---------------------: |
| **d6** | **Settlement Features** |
| **1**  |  **Highly defensible**  |
| **2**  |  **Rich in resources**  |
| **3**  |     **Overcrowded**     |
| **4**  | **Seat of government**  |
| **5**  | **Factionally divided** |
| **6**  |  **Lacking resources**  |

#### Ruins

|        |                           |
| ------ | :-----------------------: |
| **d6** |         **Ruins**         |
| **1**  |    **Forsaken temple**    |
| **2**  |    **Ransacked tomb**     |
| **3**  | **Abandonded settlement** |
| **4**  |     **Sunken villa**      |
| **5**  |  **Dilapidated cottage**  |
| **6**  |    **Ancient prison**     |

#### Lairs

|        |                      |
| ------ | :------------------: |
| **d6** |       **Lair**       |
| **1**  | **Faction hideout**  |
| **2**  |  **Blighted cave**   |
| **3**  |  **Sunken thicket**  |
| **4**  |  **Hidden burrow**   |
| **5**  |  **Colossal hive**   |
| **6**  | **Abandoned bridge** |

#### Hazards

|        |                       |
| ------ | :-------------------: |
| **d6** |      **Hazard**       |
| **1**  |  **Boiling liquid**   |
| **2**  |    **Weak ground**    |
| **3**  |   **Permanent fog**   |
| **4**  | **Poisonous foliage** |
| **5**  | **Perilous caverns**  |
| **6**  |    **Toxic mines**    |

#### Landmarks

|         |                         |
| ------- | :---------------------: |
| **d12** |      **Landmark**       |
| **1**   | **Mysterious megalith** |
| **2**   |   **Glimmering cave**   |
| **3**   |    **Ancient tree**     |
| **4**   |   **Misty waterfall**   |
| **5**   |  **Oddly-shaped lake**  |
| **6**   | **Fungus-covered well** |
| **7**   |     **Mass grave**      |
| **8**   |   **Giant skeleton**    |
| **9**   |     **Hot springs**     |
| **10**  | **Enormous footprint**  |
| **11**  |  **Endless sinkholes**  |
| **12**  |   **Petrified trees**   |

#### Special

|         |                            |
| ------- | :------------------------: |
| **d12** |        **Special**         |
| **1**   |    **Ancient library**     |
| **2**   |   **Ever-distant tower**   |
| **3**   |       **Trash heap**       |
| **4**   |   **Floating construct**   |
| **5**   |    **Unusual gravity**     |
| **6**   |     **Singing stones**     |
| **7**   |    **Trees that move**     |
| **8**   |      **Buried giant**      |
| **9**   |  **Pristine, empty city**  |
| **10**  | **Nest of the folk witch** |
| **11**  |    **Cult ritual site**    |
| **12**  |   **Bloody battlefied**    |

### Detail Names
Starting with the central hub, name each **Detail** on the map based on its unique terrain, feature, or history. 
- Settlements are often named after their unique features: the shape of the river nearby, or the large windmill in the town center. Then, the residents add a noun or adjective. _Windy Gulch, Black Tree Fort, Pitty Gardens_, etc.
- Wilderness and dangerous places are even more obvious: poison lake, greedy mines, etc. Some tell a story: _Luka's Folly, Dead Man's Path_, etc. 
- Important places should have important names: that of heroes, religious/political figures, and important events. _The Chalet of Saint Ibiz, Queen's Harvest, Light of the Nine_, etc.

### Name The Province
Consider the following when determining the **Province** name:
- What are the key geographic features of the region? 
- What major events (war, famine, discoveries) occured here in the past? Who were the major players?
- What sort of factions have historically dominated this place?
- A name may also include a reference to the region's relative position to the seat of power: _The Northeast Redoubt_, _Western Ranges_, etc.
- The name (first, or family) of a "discoverer", conquerer or colonizer often sticks around long after their death.

## Factions
- Factions rule over one or more **Details**, an entire **Province**, or even a **Domain**. 
- The map should reflect the impact of goals being completed or interrupted. **Factions** will work to achieve their goals independently.
- A **Faction** may be governed by a powerful figure, but most of the time PCs will be dealing with their lieutenants, or **Seneschals**. 

### Agendas & Resources
- Factions have **Agendas** (3-4 steps towards a clear goal) and the **Resources** to help achieve them. 
- A faction's **Resources** reflect its influence, resources, wealth, and special features. 
- Factions grow (or lose) their **Resources** by trying to complete their agenda. 

### Creating Factions
- Consider the **Details** and **Terrain** you've developed. Note what is worth protecting, as well as what is worth taking.
- **Agendas** are lofty plans with distinct steps based on actionable goals. They should relate to the acquisition of powerful territory, weapons, money, and **Resources**. 
- Do not feel limited by the table results below. If a Faction should have more or fewer **Resources**, that's OK!

#### Factions Creation Procedure
1. Starting with the central hub, roll on the [Faction Types](#faction-types) table for every Settlement **Detail** on the map. Repeat the process for at least one Lair or Ruin on the map. Consider where a **Faction** might make their home base. 
2. Roll on the [Faction Resources](#faction-resources) table for each, one **Faction** at a time.
3. Create **Resources** as indicated by the results from the table. Consider how many **Resources** a **Faction** of this type might have (between **2-4**). Roll accordingly.
4. Create at least one **Seneschal**, inspired by the likely followers of the **Faction**'s type, **Resources**, and **Agenda**. Think of where they might be located on the map.
5. Create at least one alliance between two **Factions**. Consider the region's history, then look at the **Resources** a **Faction** has, who else would want them, and what one might _trade_ for them.
6. Create at least conflict between two **Factions**. Consider the region's history, then look at the **Resources** a **Faction** has, who else might want them, and what one might do to _take_ them.
 
#### Faction Types

|         |                   |
| ------- | ----------------- |
| **d12** | **Faction Type**  |
| **1**   | **Academic**      |
| **2**   | **Arcane**        |
| **3**   | **Commoner**      |
| **4**   | **Criminal**      |
| **5**   | **Foreign**       |
| **6**   | **Government**    |
| **7**   | **Industrial**    |
| **8**   | **Mercantile**    |
| **9**   | **Military**      |
| **10**  | **Noble**         |
| **11**  | **Religious**     |
| **12**  | **Revolutionary** |

#### Faction Resources

|         |                   |                                                                              |                                    |
| ------- | ----------------- | ---------------------------------------------------------------------------- | :--------------------------------: |
| **d12** | **Resource Type** | **Example Resources**                                                        |       **Example Seneschals**       |
| **1**   | **Anonymity**     | Mercurial and hard to pin down. Shrouded in mystery.                         |      Monks, elders, demi-gods      |
| **2**   | **Apparatus**     | A powerful Relic, artifact, or tool.                                         |   Scholars, philosophers, sages    |
| **3**   | **Invisibility**  | Moves unseen, achieving its goals through a cloak-and-dagger approach.       |   Assassins, tricksters, thieves   |
| **4**   | **Fealty**        | Enjoys the loyalty of a large or important bloc of people.                   |     Lords, bannermen, farmers      |
| **5**   | **Force**         | Employs brawn as its voice, and brute force as the cudgel.                   |     Bullies, toughs, flatfoots     |
| **6**   | **Knowledge**     | Keeps tabs on friends and enemies alike via espionage and arcane privileges. |     Spies, informants, mystics     |
| **7**   | **Magic**         | Relies on the arcane arts to carry out its agenda.                           |    Wizards, spellswords, liches    |
| **7**   | **Population**    | Boasts a large number of rank and file members.                              |      Gangs, urchins, peddlers      |
| **9**   | **Position**      | Relies on a unique geographic or political immunity.                         | Outlanders, criminals, politicians |
| **10**  | **Property**      | Keeps sway over a local resource, item, or source of power.                  |     Workers, thugs, academics      |
| **11**  | **Reknown**       | Part of a de-facto regime, respected or feared.                              |    Nobles, merchants, generals     |
| **12**  | **Wealth**        | Affluent, using its riches to extend their influence and protect themselves. |   Soldiers, officials, merchants   |

#### Faction Agendas

|         |                |                                                                      |
| ------- | -------------- | -------------------------------------------------------------------- |
| **d12** | **Agenda**     | **Example Agendas**                                                  |
| **1**   | **Collect**    | Bring together ancient artifacts once thought lost.                  |
| **2**   | **Defend**     | Protect a person, place or thing at all costs.                       |
| **3**   | **Destroy**    | Eliminate a rival faction, artifact, or person.                      |
| **4**   | **Domination** | Bring disparate factions under the same leadership, and then expand. |
| **5**   | **Enrich**     | Concentrate as much wealth in the faction's coffers as possible.     |
| **6**   | **Infiltrate** | Place members in other factions, asserting control from within.      |
| **7**   | **Overthrow**  | Replace the current leadership with themselves.                      |
| **8**   | **Preserve**   | Maintain the status quo.                                             |
| **9**   | **Purge**      | Rid the land of a custom, belief, or people.                         |
| **10**  | **Revenge**    | Rectify a perceived injustice.                                       |
| **11**  | **Reveal**     | Disclose a long-kept secret.                                         |
| **12**  | **Revive**     | Restore a former leader, god, or locale.                             |

## Conclusion
Your **Province** is now complete! You can now "drill down" into various locations (starting with the hub) and build out each **Detail** with your favorite tables. Keep the following thoughts in mind as you do:
- How might the interactions between the **Factions** interact with the landscape, its features, and one another? How will this change as the **Factions** succeed (or fail) at their goals? 
- Consider the history of the region's original "discoverers", the locals they may have supplanted, and where both groups are today. 
- When building out the next **Province**, keep in mind how it would have interacted historically with this **Province**, and what might **happen** between them in the future.