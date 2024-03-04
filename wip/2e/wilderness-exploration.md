---
layout: default
title: Wilderness Exploration
grand_parent: WIP
parent: 2e
nav_exclude: true
search_exclude: true
---

# Wilderness Exploration
{: .no_toc }

<details close markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Watches

- A day is divided into three **watches**, called _morning_, _afternoon_, and _night_. 
- Each character can choose _one_ [**Wilderness Action**](#wilderness-actions) per **watch**. 
- If the characters split up, each group is treated as an independent entity.

## Points

- Potential destinations on a map are called **points**. 
- One or more **watches** may be required to journey between two **points** on a map, depending on the path, terrain, weather, and party status.
- The party has a rough idea of the challenges involved to get to their destination, but rarely any specifics. 

## Travel Duration

Travel time in Cairn is counted in watches, divided into three eight-hour segments per day. However, as most parties elect to spend the third watch of the day resting, one can use "days" as a shorthand for travel time.

To determine the distance between two points, combine all penalties from the path, terrain, and weather difficulty tables, taking into account any changes to those elements along the route. For travel via waterways, refer to the surrounding terrain difficulty. For especially vast terrain, assign a penalty of up to +2 watches to the journey.

The weather, terrain, darkness, injured party members, and other obstacles can impact travel or even make it impossible! In some cases, the party may need to add **Fatigue** or expend resources in order to sustain their pace. Mounts, guides, and maps can increase the party’s travel speed or even negate certain penalties.

## Path Difficulty

|            |             |                          |
| ---------- | ----------- | ------------------------ |
| **Path**   | **Penalty** | **Odds of Getting Lost** |
| Roads      | None        | None                     |
| Trails     | +1 Watch    | 2-in-6                   |
| Wilderness | +2 Watches  | 3-in-6                   |

|                   |             |
| ----------------- | ----------- |
| **Path Distance** | **Penalty** |
| Short             | +1 Watch    |
| Medium            | +2 Watches  |
| Long              | +3 Watches  |

## Terrain Difficulty

|                |                                 |             |                                                                                                       |
| -------------- | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| **Difficulty** | **Terrain**                     | **Penalty** | **Factors**                                                                                           |
| **Easy**       | **Plains, plateaus, valleys**   | none        | _Safe areas for rest, fellow travelers, good visibility_                                            |
| **Tough**      | **Forests, deserts, hills**     | +1 Watch    | _Wild animals, flooding, broken equipment, falling rocks, unsafe shelters, hunter's traps_            |
| **Perilous**   | **Mountains, jungles, swamp**    | +2 Watches  | _Quicksand, sucking mud, choking vines, unclean water, poisonous plants and animals, poor navigation_ |

## Weather

Each day, the Warden should roll on the weather table for the appropriate season. If the "**Extreme**" weather result is rolled twice in a row, the weather turns to "**Catastrophic**". A squall becomes a hurricane, a storm floods the valley, etc.

### Weather Type

|        |            |            |            |            |
| :----: | :--------: | :--------: | :--------: | :--------: |
| **d6** | **Spring** | **Summer** |  **Fall**  | **Winter** |
| **1**  |    Nice    |    Nice    |    Fair    |    Fair    |
| **2**  |    Fair    |    Nice    |    Fair    | Unpleasant |
| **3**  |    Fair    |    Fair    | Unpleasant | Inclement  |
| **4**  | Unpleasant | Unpleasant | Inclement  | Inclement  |
| **5**  | Inclement  | Inclement  | Inclement  |  Extreme   |
| **6**  |  Extreme   |  Extreme   |  Extreme   |  Extreme   |

## Weather Difficulty

|                  |                                                                                                         |                                                           |
| :--------------: | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
|   **Weather**    | **Effect**                                                                                              | **Examples**                                              |
|     **Nice**     | Favorable conditions for travel.                                                                        | _Clear skies, sunny_                                      |
|     **Fair**     | Favorable conditions for travel.                                                                        | _Overcast, breezy_                                        |
|  **Unpleasant**  | Add a **Fatigue** _or_ add one **watch** to the journey.                                                | _Gusting winds, rain showers, sweltering heat, chill air_ |
|  **Inclement**   | Add a **Fatigue** _or_ add **+1 watch**. Increase terrain **Difficulty** by a step.  | _Thunderstorms & lightning, rain, muddy ground_           |
|   **Extreme**    | Add a **Fatigue** _and_ add **+1 watch**. Increase terrain **Difficulty** by a step. | _Blizzards, freezing winds, flooding, mud slides_         |
| **Catastrophic** | Most parties cannot travel under these conditions.                                                      | _Tornados, tidal waves, hurricane, volcanic eruption_     |

## Wilderness Exploration Cycle

1. The **Warden** describes the current **point** or **region** on the map and how the path, weather, terrain, or party status might affect **travel speed**. The party plots or adjusts a given course towards their destination. 
2. Each party member chooses a single **Wilderness Action**. The **Warden** narrates the results for each and then rolls on the [**Wilderness Events**](#wilderness-events) table. The party responds to the results.
3. The **players** and the **Warden** record any loss of resources and new conditions (i.e. torch use, _deprivation_, etc), and the cycle repeats. 

## Wilderness Events

|       |                 |                                                                                                                                                                                                                            |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Encounter**   | Roll on an encounter table for that terrain type or location. Don’t forget to roll for NPC [reactions](/cairn-srd/#reactions) if applicable.                                                                               |
| **2** | **Sign**        | The party discovers a clue, spoor, or indication of a nearby encounter, locality, hidden feature, or information about a nearby area.                                                                                      |
| **3** | **Environment** | A shift in weather or terrain.                                                                                                                                                                                             |
| **4** | **Loss**        | The party is faced with a choice that costs them a resource (rations, tools, etc), time, or effort.                                                                                                                        |
| **5** | **Exhaustion**  | The party encounters a barrier, forcing effort, care or delays. This might mean spending extra time (and an additional **Wilderness Action**) or adding **Fatigue** to the PC's inventory to represent their difficulties. |
| **6** | **Discovery**   | The party finds food, treasure, or other useful resources. The **Warden** can instead choose to reveal the primary feature of the area.                                                                                    |

## Wilderness Actions

### Travel

- Travel begins. Obvious locations, features, and terrain of nearby areas are revealed according to their distance. This action is typically taken by the entire party as one.
- The party rolls 1d6 to see if they get lost along the way. This risk can increase or decrease, depending on path **Difficulty**, maps, party skills, and guides.
- If lost, the party may need to spend a **Wilderness Action** to recover their way. Otherwise, the party reaches the next **point** along their route. Remember to compare the results of getting lost to the relevant path **Difficulty**. 

### Explore

- One or more party members search a large area, searching for hidden features, scouting ahead, or treading carefully.
- A Location (shelter, village, cave, etc.) or Feature (geyser, underground river, beached ship, etc.) is discovered.
- The **Travel** action is still required to _leave_ the current area, even if it has been completely explored.

### Supply

- Characters can hunt, fish, or forage for food, with the first PC to take this action collecting 1d4 **Rations** (3 uses each).
- The chance of a greater bounty increases with each additional participant (e.g. 1d4 becomes 1d6, up to a maximum of 1d12). Relevant experience or equipment may also increase the bounty.
- The party may encounter homes and small villages, spending gold and a full **watch** to resupply. 

### Make Camp

- The party stops to set up camp in the wilds. Each party member (and their mounts) consume a **Ration**.
- A **lookout rotation** is set so that the party can sleep unmolested. At least 3 rotations are necessary to ensure that all party members can rest. A smaller party may need to risk sleeping unguarded, or switch off sleeping over multiple days (see [**Sleep**](#sleep)).
- Party members that were able to rest remove all of **Fatigue** from their inventory.

## Wilderness Elements

### Night

- The party can choose to travel during the night and rest during the day, but night travel is far slower and more treacherous!
- Traveling at night is always more dangerous! The **Warden** should roll _twice_ on the [**Wilderness Events**](#wilderness-events) table.
- Some terrain and weather may be easier to traverse at night (desert, for example). The **Warden** should balance these challenges along with any other.

### Sleep

- The last **watch** of the day is typically reserved for the [**Make Camp**](#make-camp) action.
- Characters typically need to sleep each day. Anything beyond a minor interruption can negate or cancel the benefits of sleep.
- If the party skips the **Make Camp** action, they each add a **Fatigue** to their inventory, and are _deprived_. Additionally, traveling when sleep-deprived raises the terrain **Difficulty** by a step (i.e. _Easy_ becomes _Tough_).

### Light

- Torches and other radial sources of light illuminate 40ft ahead of the party, but beyond that only provides a dim outline of objects.
- Characters without a light source may suffer from _panic_ until their situation is remedied. 
- Environmental conditions (sudden gusts of wind, dust, water, etc.) can easily blow out a torch.

### Light Sources

- A torch can be lit 3 times before degrading. 
- A lantern can be relit indefinitely, but requires a separate oil can (6 uses).
