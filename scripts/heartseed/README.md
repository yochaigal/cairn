# Heartseed
Version 0.1.0

## Files

- `heartseed.py`

Heartseed is a portable character generator for Cairn. The script is fully self-contained and includes all rules data internally.
You can generate characters from both the [Second Edition](https://cairnrpg.com/second-edition/) of Cairn and [Barebones Edition](https://cairnrpg.com/barebones/).

---

## General Usage

```bash
python heartseed.py [OPTIONS]
```

Heartseed is fully self-contained. It has no runtime data-file dependencies and does not require external JSON or markdown rules files.

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
--md output.md
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

python heartseed.py --edition 2e --all-backgrounds --md all.md

python heartseed.py --edition barebones --count 10

python heartseed.py --edition barebones --package Cleric --seed 42

python heartseed.py --edition barebones --background "Librarian" --md libs.md
```

## Versioning

Print the current version:

```bash
python heartseed.py --version
```

This prints the version embedded in the script.

To sync the README header version automatically:

```bash
python heartseed.py --update-readme-version README.md
```

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).