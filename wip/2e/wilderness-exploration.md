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

> ### Weather
> Each day, the **Warden** rolls on the [**Weather**](#weather-difficulty) table for the appropriate season.

## Points

- Potential destinations on a map are called **points**. 
- One or more **watches** may be required to journey between two **points** on a map, depending on the path, terrain, weather, and party status.
- The party has a rough idea of the challenges involved to get to their destination, but rarely any specifics. 

> ### Hexes
> When using a hex map, assume a tile takes one watch to cross, and that if the party [**gets lost**](#getting-lost) they end up in a random adjacent hex.

## Travel Duration

Travel time in Cairn is counted in watches, divided into three eight-hour segments per day. However, as most parties elect to spend the third watch of the day resting, one can use "Days" as a shorthand for travel. For example, if the distance between two points is equal to four watches, the party would need to travel for two Days, arriving in the evening of the second day. 

To determine the distance between two points, combine the penalties from both **Path** and **Terrain** types. Consult the [Terrain](#terrain-difficulty) and [Path Difficulty](#path-difficulty) tables to determine the appropriate penalty to travel. For instance, if two **points** on the map are connected by a forest trail, the total travel distance would be 3 watches (+1 watch for the winding trail and +2 watches for the _Tough_ wooded terrain). 

Traveling by a maintained road incurs _no_ penalties to travel, while trails add one watch to the journey. Traveling through the wilderness _always_ adds two watches. Include penalties from any changes in paths or terrain along the route, and for longer journeys add up to +3 watches. For travel via waterways, refer to the surrounding terrain difficulty. 

The [**weather**](#weather-difficulty), [**terrain**](#terrain-difficulty), [**night travel**](#night), _deprived_ or injured party members, or other obstacles can reduce the party's speed, or make travel impossible! In some cases, the party need to add **Fatigue** or expend resources in order to sustain their pace. Mounts, guides, and maps can increase the party's travel speed or even negate certain penalties.  

## Wilderness Exploration Cycle

1. The **Warden** describes the current **point** or **region** on the map and how the path, weather, terrain, or party status might affect **travel speed**. The party plots or adjusts a given course towards their destination. 
2. Each party member chooses a single **Wilderness Action**. The **Warden** narrates the results for each and then rolls on the [**Wilderness Events**](#wilderness-events) table. The party responds to the results.
3. The **players** and the **Warden** record any loss of resources and new conditions (i.e. torch use, _deprivation_, etc), and the cycle repeats. 

## Night

- The party can choose to travel during the night and rest during the day, but night travel is far slower and more treacherous!
- Traveling at night _always_ increases the [Terrain Difficulty](#terrain-difficulty) by one step (i.e. _Easy_ terrain becomes _Tough_) and the **Warden** rolls twice on the [**Wilderness Events**](#wilderness-events) table.
- Some terrain and weather may be easier to traverse at night (desert, for example). The **Warden** should balance these challenges along with any other.

### Sleep

- The last **watch** of the day is typically reserved for the [**Make Camp**](#make-camp) action.
- Characters typically need to sleep each day. Anything beyond a minor interruption can negate or cancel the benefits of sleep.
- If the party skips the **Make Camp** action, they each add a **Fatigue** to their inventory, and are _deprived_. Additionally, traveling when sleep-deprived raises the terrain **Difficulty** by one step (i.e. _Easy_ becomes _Tough_).

### Light

- Torches and other radial sources of light illuminate 40ft ahead of the party, but beyond that only provides a dim outline of objects.
- Characters without a light source may suffer from _panic_ until their situation is remedied. 
- Environmental conditions (sudden gusts of wind, dust, water, etc.) can easily blow out a torch.

> ### Light Sources
> A torch can be lit 3 times before degrading. A lantern can be relit indefinitely, but requires an oil can (6 uses).

### Path Difficulty

|            |             |                          |
| ---------- | ----------- | ------------------------ |
| **Path**   | **Penalty** | **Odds of Getting Lost** |
| Roads      | +0 Watches  | None                     |
| Trails     | +1 Watch    | 2-in-6                   |
| Wilderness | +2 Watches  | 4-in-6                   |

### Terrain Difficulty


|                |                                 |             |                                                                                                       |
| -------------- | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| **Difficulty** | **Terrain**                     | **Penalty** | **Factors**                                                                                          |
| **Easy**       | **Plains, grasslands, valleys** | +1 Watch    | _Safe areas for rest, fellow travelers, good visibilities_                                            |
| **Tough**      | **Forests, deserts, hills**     | +2 Watches  | _Wild animals, flooding, broken equipment, falling rocks, unsafe shelters, hunter's traps_            |
| **Perilous**   | **Mountains, jungle, swamp**    | +3 Watches  | _Quicksand, sucking mud, choking vines, unclean water, poisonous plants and animals, poor navigation_ |

### Weather Difficulty

|                  |                                                                                                         |                                                           |
| :--------------: | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
|   **Weather**    | **Effect**                                                                                              | **Examples**                                              |
|     **Nice**     | Favorable conditions for travel.                                                                        | _Clear skies, sunny_                                      |
|     **Fair**     | Favorable conditions for travel.                                                                        | _Overcast, breezy_                                        |
|  **Unpleasant**  | Add a **Fatigue** _or_ add one **watch** to the journey.                                                | _Gusting winds, rain showers, sweltering heat, chill air_ |
|  **Inclement**   | Add a **Fatigue** _or_ add one **watch** to the journey. Terrain **Difficulty** increases by one step.  | _Thunderstorms & lightning, rain, muddy ground_           |
|   **Extreme**    | Add a **Fatigue** _and_ add one **watch** to the journey. Terrain **Difficulty** increases by one step. | _Blizzards, freezing winds, flooding, mud slides_         |
| **Catastrophic** | Most parties cannot travel under these conditions.                                                      | _Tornados, tidal waves, hurricane, volcanic eruption_     |

## Wilderness Actions

### Travel

- Travel begins. Obvious locations, features, and terrain of nearby areas are revealed according to their distance. This action is typically taken by the entire party as one.
- The party rolls 1d6 to see if they get lost along the way. This risk can increase or decrease, depending on the terrain and weather **Difficulty**, items, skills, and relevant backgrounds of the party.
- If lost, the party may need to spend a **Wilderness Action** to recover their way. Otherwise, the party reaches the next **point** along their route. Remember to compare the results of getting lost to the relevant terrain or weather **Difficulty**. For example, _Tough_ terrain in _Fair_ weather would require a roll of 2 or under in order for the party to get lost. 

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

## Tables

### Weather
If the "**Extreme**" weather result is rolled twice in a row, the weather turns to "**Catastrophic**". A squall becomes a hurricane, a storm floods the valley, etc.

|        |            |            |            |            |
| :----: | :--------: | :--------: | :--------: | :--------: |
| **d6** | **Spring** | **Summer** |  **Fall**  | **Winter** |
| **1**  |    Nice    |    Nice    |    Fair    |    Fair    |
| **2**  |    Fair    |    Nice    |    Fair    | Unpleasant |
| **3**  |    Fair    |    Fair    | Unpleasant | Inclement  |
| **4**  | Unpleasant | Unpleasant | Inclement  | Inclement  |
| **5**  | Inclement  | Inclement  | Inclement  |  Extreme   |
| **6**  |  Extreme   |  Extreme   |  Extreme   |  Extreme   |

### Wilderness Events

|       |                 |                                                                                                                                                                                                                            |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Encounter**   | Roll on an encounter table for that terrain type or location. Don’t forget to roll for NPC [reactions](/cairn-srd/#reactions) if applicable.                                                                               |
| **2** | **Sign**        | The party discovers a clue, spoor, or indication of a nearby encounter, locality, hidden feature, or information about a nearby area.                                                                                      |
| **3** | **Environment** | A shift in weather or terrain.                                                                                                                                                                                             |
| **4** | **Loss**        | The party is faced with a choice that costs them a resource (rations, tools, etc), time, or effort.                                                                                                                        |
| **5** | **Exhaustion**  | The party encounters a barrier, forcing effort, care or delays. This might mean spending extra time (and an additional **Wilderness Action**) or adding **Fatigue** to the PC's inventory to represent their difficulties. |
| **6** | **Discovery**   | The party finds food, treasure, or other useful resources. The **Warden** can instead choose to reveal the primary feature of the area.                                                                                    |
