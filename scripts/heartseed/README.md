# Heartseed

## Files

- `heartseed.py`

Heartseed is a portable character generator for Cairn. The script is fully self-contained and includes all rules data internally.
It can generate characters for both the Second Edition Barebones Edition of Cairn.

---

## General Usage

```bash
python heartseed.py [OPTIONS]
```

---

## Editions

```bash
--edition 2e
--edition barebones
```

Default: `2e`

---

## Background Options (2e)

```bash
--background "Aurifex"
--background "Barber-Surgeon"
--background "Beast Handler"
--background "Bonekeeper"
--background "Cutpurse"
--background "Fieldwarden"
--background "Fletchwind"
--background "Foundling"
--background "Fungal Forager"
--background "Greenwise"
--background "Half-Witch"
--background "Hexenbane"
--background "Jongleur"
--background "Kettlewright"
--background "Marchguard"
--background "Mountebank"
--background "Outrider"
--background "Prowler"
--background "Rill Runner"
--background "Scrivener"
```

Generate all:

```bash
--all-backgrounds
```

---

## Barebones Options

Random characters:

```bash
--edition barebones --count 5
```

Specific background:

```bash
--edition barebones --background "Librarian"
```

List available backgrounds:

```bash
--edition barebones --list-backgrounds
```

---

## Barebones Gear Packages

```bash
--package Fighter
--package Thief
--package Magic-User
--package Cleric
```

List packages:

```bash
--edition barebones --list-packages
```

---

## Output Options

Write to markdown file:

```bash
--markdown output.md
```

Omit background name in header:

```bash
--omit-background-name
```

---

## Generation Controls

Number of characters:

```bash
--count 5
```

Deterministic output:

```bash
--seed 42
```

---

## Examples

```bash
python heartseed.py --edition 2e --background "Aurifex" --count 5

python heartseed.py --edition 2e --all-backgrounds --markdown all.md

python heartseed.py --edition barebones --count 10

python heartseed.py --edition barebones --package Cleric --seed 42

python heartseed.py --edition barebones --background "Librarian" --markdown libs.md
```