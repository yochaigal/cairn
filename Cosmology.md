---
layout: default
title: Cosmology
nav_order: 2
nav_exclude: true

---

# Cosmology


```mermaid
%%{init: {'theme':'forest'}}%%
graph TD
    Veil
    Hostile
    Degenesis
    
    subgraph Sidereal
		Nibiru 
	end
	subgraph Iterums
		Arrival
		Rhun("Rhûn")
	end
    
    Veil ---> Hostile
    Veil -.-> Arrival
    Veil -.-> Degenesis
    Hostile ---> Degenesis
    Hostile ---> Sidereal
    Degenesis ---> Iterums
    
    click Hostile "https://terra-campaigns.github.io/hostile/" _blank
    click Degenesis "https://terra-campaigns.github.io/degenesis/" _blank
    click Nibiru "https://terra-campaigns.github.io/nibiru/" _blank
    click Arrival "https://terra-campaigns.github.io/arrival/" _blank
```
