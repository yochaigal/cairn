#!/usr/bin/env python3

from __future__ import annotations

import argparse
import base64
import io
import json
import random
import re
import shutil
import tempfile
import zipfile
__version__ = "0.1.0"
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

SECOND_EDITION_BACKGROUNDS = [
    "Aurifex",
    "Barber-Surgeon",
    "Beast Handler",
    "Bonekeeper",
    "Cutpurse",
    "Fieldwarden",
    "Fletchwind",
    "Foundling",
    "Fungal Forager",
    "Greenwise",
    "Half Witch",
    "Hexenbane",
    "Jongleur",
    "Kettlewright",
    "Marchguard",
    "Mountebank",
    "Outrider",
    "Prowler",
    "Rill Runner",
    "Scrivener",
]

TRAIT_ORDER = ["Physique", "Skin", "Hair", "Face", "Speech", "Clothing", "Virtue", "Vice"]

UNIVERSAL_STARTING_GEAR = [
    {"name": "Rations", "tags": ["uses"], "uses": 3},
    {"name": "Torch", "tags": ["uses"], "uses": 3},
]

TRANSPORT_NAMES = {
    "Cart",
    "Wagon",
    "Horse",
    "Mule",
    "Donkey",
    "Burial Wagon",
    "Heavy Destrier",
    "Blacklegged Dandy",
    "Rivertooth",
    "Piebald Cob",
    "Linden White",
    "Stray Fogger",
}


@dataclass
class Spell:
    name: str
    mechanical: str
    descriptive: str


@dataclass
class Item:
    name: str
    tags: List[str] = field(default_factory=list)
    uses: Optional[int] = None
    charges: Optional[int] = None
    description: str = ""
    slot_override: Optional[int] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Item":
        return cls(
            name=str(data.get("name", "")).strip(),
            tags=[str(t).strip() for t in data.get("tags", [])],
            uses=data.get("uses"),
            charges=data.get("charges"),
            description=str(data.get("description", "")).strip(),
            slot_override=data.get("slot_override"),
        )

    def clone(self) -> "Item":
        return Item(
            name=self.name,
            tags=list(self.tags),
            uses=self.uses,
            charges=self.charges,
            description=self.description,
            slot_override=self.slot_override,
        )

    def slot_count(self) -> int:
        if self.slot_override is not None:
            return self.slot_override
        lower_tags = {t.lower() for t in self.tags}
        if "petty" in lower_tags:
            return 0
        if "bulky" in lower_tags:
            return 2
        if self.display_name() in TRANSPORT_NAMES:
            return 0
        if re.search(r"\+\d+\s*slots", self.description, flags=re.IGNORECASE):
            return 0
        return 1

    def armor_value(self) -> int:
        value = 0
        for tag in self.tags:
            m = re.search(r"([+]?\d+)\s*armor", tag, flags=re.IGNORECASE)
            if m:
                value = max(value, int(m.group(1).replace("+", "")))
        return value

    def is_spellbook(self) -> bool:
        return self.name.lower().startswith("spellbook") or self.name.lower().endswith(" spellbook")

    def is_scroll(self) -> bool:
        return self.name.lower().startswith("scroll") or self.name.lower().endswith(" scroll")

    def is_lantern(self) -> bool:
        return self.display_name() == "Lantern"

    def is_oil(self) -> bool:
        return self.display_name() in {"Oil", "Oil Can"}

    def is_weapon(self) -> bool:
        return any(re.fullmatch(r"d\d+(?:\+d\d+)?", t.lower()) for t in self.tags)

    def display_name(self) -> str:
        name = re.sub(r"\s+", " ", self.name.strip())
        if not name:
            return name
        if name.islower():
            return name.title()
        return name

    def gear_text(self) -> str:
        spell_kind, spell_name = spell_kind_and_name(self)
        if spell_kind and spell_name:
            if spell_kind == "Spellbook":
                return f"Spellbook: _{spell_name}_"
            return f"Scroll: _{spell_name}_ (_petty_)"

        name = self.display_name()
        paren_bits: List[str] = []
        if self.armor_value() > 0:
            paren_bits.append(f"{self.armor_value()} Armor")
        for tag in self.tags:
            low = tag.lower()
            if low == "bonus defense":
                continue
            if re.fullmatch(r"[+]?\d+\s*armor", low):
                continue
            if low == "uses" and self.uses is not None:
                paren_bits.append(f"{self.uses} {'use' if self.uses == 1 else 'uses'}")
                continue
            if low == "charges" and self.charges is not None:
                paren_bits.append(f"{self.charges} {'charge' if self.charges == 1 else 'charges'}")
                continue
            if re.fullmatch(r"d\d+(?:\+d\d+)?(?:\s*str)?", low):
                paren_bits.append(tag)
                continue
            if low in {"blast", "bulky", "petty"}:
                paren_bits.append(f"_{low}_")
                continue
            if low == "1 use":
                paren_bits.append("1 use")
                continue
        if not paren_bits:
            return name
        return f"{name} ({', '.join(paren_bits)})"


@dataclass
class Character:
    name: str
    background: str
    hp: int
    strength: int
    dexterity: int
    willpower: int
    traits: Dict[str, str]
    age: int
    gold: int
    gear: List[Item]
    spell_lines: List[Spell]

    def armor_total(self) -> int:
        return min(3, sum(item.armor_value() for item in self.gear))

    def slot_total(self) -> int:
        return sum(item.slot_count() for item in self.gear)

    def format_header(self, omit_background: bool = False) -> str:
        return f"**{self.name}**" if omit_background else f"**{self.name}, {self.background}**"

    def format_stats(self) -> str:
        parts = [f"{self.hp} HP"]
        armor = self.armor_total()
        if armor > 0:
            parts.append(f"{armor} Armor")
        parts.extend([f"{self.strength} STR", f"{self.dexterity} DEX", f"{self.willpower} WIL"])
        return ", ".join(parts)

    def format_traits(self) -> str:
        return (
            f"{self.traits['Physique']} physique, {self.traits['Skin']} skin, "
            f"{self.traits['Hair']}-haired, {self.traits['Face']} face, "
            f"{self.traits['Speech']} voice, {self.traits['Clothing']} clothes; "
            f"{self.traits['Virtue']}, but {self.traits['Vice']}. Age {self.age}. You have {self.gold} GP."
        )

    def format_gear(self) -> str:
        items = ", ".join(item.gear_text() for item in self.gear)
        return f"**Gear ({self.slot_total()}/10 slots):** {items}."

    def format_spells(self) -> List[str]:
        lines: List[str] = []
        for spell in self.spell_lines:
            if spell.descriptive:
                lines.append(f"**{spell.name}**: {spell.mechanical} *{spell.descriptive}*")
            else:
                lines.append(f"**{spell.name}**: {spell.mechanical}")
        return lines

    def render(self, omit_background: bool = False) -> str:
        parts = [
            self.format_header(omit_background=omit_background),
            self.format_stats(),
            self.format_traits(),
            self.format_gear(),
        ]
        parts.extend(self.format_spells())
        return "\n".join(parts)


class SharedResources:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.traits = load_json(data_dir / "traits.json")
        self.marketplace = load_json(data_dir / "marketplace.json")


class SecondEditionGenerator:
    def __init__(self, resources: SharedResources, rng: random.Random):
        self.resources = resources
        self.rng = rng
        self.backgrounds = load_json(resources.data_dir / "background_data.json")

    def background_names(self) -> List[str]:
        return list(SECOND_EDITION_BACKGROUNDS)

    def generate(self, background_name: str) -> Character:
        background = self.backgrounds[background_name]
        option1 = self.rng.choice(background["table1"]["options"])
        option2 = self.rng.choice(background["table2"]["options"])

        name = self.rng.choice(background["names"])
        traits = random_traits(self.resources.traits, self.rng)
        strength = roll_dice(self.rng, 3, 6)
        dexterity = roll_dice(self.rng, 3, 6)
        willpower = roll_dice(self.rng, 3, 6)
        hp = roll_dice(self.rng, 1, 6)
        age = roll_dice(self.rng, 2, 20) + 10
        gold = roll_dice(self.rng, 3, 6) + int(option1.get("bonus_gold", 0)) + int(option2.get("bonus_gold", 0))
        hp = apply_hp_modifiers(hp, self.rng, option1, option2)

        starting_gear = [Item.from_dict(x) for x in background.get("starting_gear", [])]
        starting_gear = [x for x in starting_gear if x.display_name() not in {"Rations", "Torch"}]

        option1_items = [Item.from_dict(x) for x in option1.get("items", [])]
        option2_items = [Item.from_dict(x) for x in option2.get("items", [])]
        containers = parse_containers(option1) + parse_containers(option2)

        option1_items.extend(self.random_gear_table_items(option1))
        option2_items.extend(self.random_gear_table_items(option2))

        gear = [Item.from_dict(x) for x in UNIVERSAL_STARTING_GEAR]
        ordered_items = order_second_edition_items(starting_gear, option1_items + option2_items)
        gear.extend(ordered_items)
        gear.extend(containers)

        spell_lines = collect_spell_lines(gear)
        return Character(name, background_name, hp, strength, dexterity, willpower, traits, age, gold, gear, spell_lines)

    def random_gear_table_items(self, option: Dict[str, Any]) -> List[Item]:
        budget = option.get("gear_table")
        if not budget:
            return []
        budget = int(budget)
        gear_table = self.resources.marketplace.get("Gear", {})
        affordable = [(name, data) for name, data in gear_table.items() if int(data.get("cost", 9999)) <= budget]
        if not affordable:
            return []
        name, data = self.rng.choice(affordable)
        entry = {"name": normalize_marketplace_name(name), **data}
        return [Item.from_dict(entry)]


class BarebonesData:
    def __init__(self, resources: SharedResources):
        self.resources = resources
        base = resources.data_dir
        self.creation_text = (base / "barebones-character-creation.md").read_text(encoding="utf-8")
        self.spellbooks_text = (base / "barebones-spellbooks.md").read_text(encoding="utf-8")
        self.packages_text = (base / "barebones-gear-packages.md").read_text(encoding="utf-8")
        self.names = parse_names_table(self.creation_text)
        self.backgrounds = parse_barebones_backgrounds(self.creation_text)
        self.additional_gear = parse_single_column_table(self.creation_text, "#### Additional Gear")
        self.armor_table = parse_single_column_table(self.creation_text, "#### Armor (d6)", second_column=True)
        self.weapon_table = parse_single_column_table(self.creation_text, "#### Weapons (d6)", second_column=True)
        self.spellbooks = parse_spellbooks(self.spellbooks_text)
        self.packages = parse_gear_packages(self.packages_text)


class BarebonesGenerator:
    def __init__(self, resources: SharedResources, rng: random.Random):
        self.resources = resources
        self.rng = rng
        self.data = BarebonesData(resources)

    def background_names(self) -> List[str]:
        return sorted(self.data.backgrounds.keys())

    def package_names(self) -> List[str]:
        return list(self.data.packages.keys())

    def generate_background(self, background_name: Optional[str] = None) -> Character:
        if background_name is None:
            background_name = self.rng.choice(self.background_names())
        bg = self.data.backgrounds[background_name]
        first = self.rng.choice(self.data.names[0])
        last = self.rng.choice(self.data.names[1])
        name = f"{first} {last}"
        age = roll_dice(self.rng, 2, 20) + 10
        strength, dexterity, willpower = [roll_dice(self.rng, 3, 6) for _ in range(3)]
        hp = roll_dice(self.rng, 1, 6)
        gold = roll_dice(self.rng, 3, 6)
        traits = random_traits(self.resources.traits, self.rng)

        gear = [Item.from_dict(x) for x in UNIVERSAL_STARTING_GEAR]
        background_items = [self.expand_special_item(parse_item_string(item)) for item in bg["gear"]]
        armor_item = self.expand_special_item(parse_item_string(self.choose_armor_result()))
        weapon_item = self.expand_special_item(parse_item_string(self.choose_weapon_result()))
        additional_item = self.expand_special_item(parse_item_string(self.choose_additional_gear(exclude_names=gear + background_items + [armor_item, weapon_item])))

        # Background gear first, then armor, weapon, additional gear.
        gear.extend([item for item in background_items if not item.is_spellbook() and not item.is_scroll()])
        if armor_item.display_name() != "None":
            gear.append(armor_item)
        gear.append(weapon_item)
        gear.append(additional_item)
        spell_items = [item for item in background_items + [armor_item, weapon_item, additional_item] if item.is_spellbook() or item.is_scroll()]
        gear.extend(spell_items)

        deduped = dedupe_exact_duplicates(gear)
        spell_lines = collect_spell_lines(deduped, self.data.spellbooks)
        return Character(name, background_name, hp, strength, dexterity, willpower, traits, age, gold, deduped, spell_lines)

    def generate_package(self, package_name: str) -> Character:
        package = self.data.packages[package_name]
        first = self.rng.choice(self.data.names[0])
        last = self.rng.choice(self.data.names[1])
        name = f"{first} {last}"
        age = roll_dice(self.rng, 2, 20) + 10
        strength, dexterity, willpower = [roll_dice(self.rng, 3, 6) for _ in range(3)]
        hp = roll_dice(self.rng, 1, 6)
        gold = roll_dice(self.rng, 3, 6)
        traits = random_traits(self.resources.traits, self.rng)

        items = [self.expand_special_item(parse_item_string(x)) for x in package]
        # Replace package gold with rolled gold and keep listed order.
        items = [x for x in items if not x.name.lower().endswith("gold pieces")]
        gear = items
        spell_lines = collect_spell_lines(gear, self.data.spellbooks)
        return Character(name, package_name, hp, strength, dexterity, willpower, traits, age, gold, gear, spell_lines)

    def choose_armor_result(self) -> str:
        result = self.rng.choice(self.data.armor_table)
        if result.lower().startswith("none"):
            return "None"
        return result

    def choose_weapon_result(self) -> str:
        result = self.rng.choice(self.data.weapon_table)
        # Choose the first example from grouped weapon text.
        text = clean_md_links(result)
        text = text.split("(")[0].strip()
        first = text.split(",")[0].strip()
        m = re.search(r"\(([^)]+)\)", result)
        if m:
            tags = m.group(1)
            return f"{first} ({tags})"
        return first

    def choose_additional_gear(self, exclude_names: Sequence[Item]) -> str:
        excluded = {normalize_name_for_comparison(x.display_name()) for x in exclude_names}
        pool = self.data.additional_gear[:]
        self.rng.shuffle(pool)
        for entry in pool:
            name = normalize_name_for_comparison(clean_item_name(entry))
            if name not in excluded:
                return entry
        return self.rng.choice(self.data.additional_gear)

    def expand_special_item(self, item: Item) -> Item:
        name = item.display_name()
        lowered = strip_markdown_italics(name).lower().strip()
        if lowered in {"spellbook", "random spellbook"}:
            spell = self.random_spell()
            return spellbook_item(spell)
        if lowered == "scroll of random spellbook":
            spell = self.random_spell()
            return scroll_item(spell)
        return item

    def random_spell(self) -> Spell:
        spell_name = self.rng.choice(sorted(self.data.spellbooks.keys()))
        return self.data.spellbooks[spell_name]


def random_traits(traits: Dict[str, List[str]], rng: random.Random) -> Dict[str, str]:
    return {key: rng.choice(traits[key]) for key in TRAIT_ORDER}


def apply_hp_modifiers(hp: int, rng: random.Random, *options: Dict[str, Any]) -> int:
    text = " ".join(str(opt.get("description", "")) for opt in options)
    if "+d4 hp" in text.lower():
        hp += roll_dice(rng, 1, 4)
    return hp


def parse_containers(option: Dict[str, Any]) -> List[Item]:
    items: List[Item] = []
    for c in option.get("containers", []):
        item = Item.from_dict({"name": c.get("name", "Container")})
        item.description = f"+{c.get('slots', 0)} slots"
        item.slot_override = 0
        items.append(item)
    return items


def order_second_edition_items(starting_gear: Sequence[Item], rolled_items: Sequence[Item]) -> List[Item]:
    non_spells = [x for x in rolled_items if not x.is_spellbook() and not x.is_scroll()]
    spells = [x for x in rolled_items if x.is_spellbook() or x.is_scroll()]
    all_items = list(starting_gear) + non_spells

    lanterns = [x for x in all_items if x.is_lantern()]
    oils = [x for x in all_items if x.is_oil()]
    remaining = [x for x in all_items if not x.is_lantern() and not x.is_oil()]
    armor = [x for x in remaining if x.armor_value() > 0]
    remaining = [x for x in remaining if x.armor_value() == 0]
    weapons = [x for x in remaining if x.is_weapon()]
    additional = [x for x in remaining if not x.is_weapon()]
    return lanterns + oils + additional + armor + weapons + spells


def dedupe_exact_duplicates(items: Sequence[Item]) -> List[Item]:
    seen: Dict[Tuple[str, Tuple[str, ...], Optional[int], Optional[int]], int] = {}
    result: List[Item] = []
    for item in items:
        key = (item.display_name(), tuple(sorted(item.tags)), item.uses, item.charges)
        if key in seen:
            result.append(item)
            continue
        seen[key] = 1
        result.append(item)
    return result


def collect_spell_lines(items: Sequence[Item], spell_map: Optional[Dict[str, Spell]] = None) -> List[Spell]:
    lines: List[Spell] = []
    for item in items:
        kind, spell_name = spell_kind_and_name(item)
        if not kind or not spell_name:
            continue
        if spell_map and spell_name in spell_map:
            lines.append(spell_map[spell_name])
            continue
        lines.append(spell_from_item_description(spell_name, item.description))
    return lines


def split_spell_description(description: str) -> Tuple[str, str]:
    desc = description.strip()
    if not desc:
        return "", ""
    if "." not in desc:
        return ensure_period(desc), ""
    first, rest = desc.split(".", 1)
    mechanical = ensure_period(first.strip())
    descriptive = rest.strip()
    descriptive = descriptive if not descriptive else ensure_period(descriptive)
    return mechanical, descriptive


def spell_from_item_description(spell_name: str, description: str) -> Spell:
    mechanical, descriptive = split_spell_description(description)
    return Spell(spell_name, mechanical, descriptive)


def spellbook_item(spell: Spell) -> Item:
    return Item(name=f"Spellbook ({spell.name})", description=f"{spell.mechanical} {spell.descriptive}".strip())


def scroll_item(spell: Spell) -> Item:
    return Item(name=f"Scroll ({spell.name})", tags=["petty"], description=f"{spell.mechanical} {spell.descriptive}".strip())


def spell_kind_and_name(item: Item) -> Tuple[Optional[str], Optional[str]]:
    name = item.display_name()
    if item.is_spellbook():
        m = re.match(r"Spellbook\s*\(([^)]+)\)", name, flags=re.IGNORECASE)
        if m:
            return "Spellbook", m.group(1).strip()
        m = re.match(r"(.+?)\s+Spellbook$", name, flags=re.IGNORECASE)
        if m:
            return "Spellbook", m.group(1).strip()
    if item.is_scroll():
        m = re.match(r"Scroll\s*\(([^)]+)\)", name, flags=re.IGNORECASE)
        if m:
            return "Scroll", m.group(1).strip()
        m = re.match(r"Scroll of\s+(.+)$", name, flags=re.IGNORECASE)
        if m:
            return "Scroll", strip_markdown_italics(m.group(1)).strip()
        m = re.match(r"(.+?)\s+Scroll$", name, flags=re.IGNORECASE)
        if m:
            return "Scroll", m.group(1).strip()
    return None, None


def parse_names_table(text: str) -> Tuple[List[str], List[str]]:
    header = "### Names (d100)"
    table = extract_markdown_table(text, header)
    first_names: List[str] = []
    surnames: List[str] = []
    for row in table:
        if len(row) >= 3 and row[0].isdigit():
            first_names.append(row[1])
            surnames.append(row[2])
    return first_names, surnames


def parse_barebones_backgrounds(text: str) -> Dict[str, Dict[str, Any]]:
    table = extract_markdown_table(text, "## Background")
    backgrounds: Dict[str, Dict[str, Any]] = {}
    for row in table:
        if len(row) < 2 or not row[0].isdigit():
            continue
        cell = clean_md_links(row[1])
        m = re.match(r"\*\*(.+?)\*\*:\s*(.+)", cell)
        if not m:
            continue
        name = m.group(1).strip()
        gear_text = m.group(2).strip()
        gear_items = split_csv_respecting_parens(gear_text)
        backgrounds[name] = {"gear": gear_items}
    return backgrounds


def parse_single_column_table(text: str, header: str, second_column: bool = False) -> List[str]:
    table = extract_markdown_table(text, header)
    results: List[str] = []
    for row in table:
        if len(row) < 2:
            continue
        if row[0].lower().startswith("d") or row[0].lower().startswith("**d"):
            continue
        col = row[1] if second_column else row[-1]
        results.append(clean_md_links(col))
    return results


def parse_spellbooks(text: str) -> Dict[str, Spell]:
    table = extract_markdown_table(text, "# Barebones Edition Spellbooks")
    spells: Dict[str, Spell] = {}
    for row in table:
        if len(row) < 3:
            continue
        if not row[0].strip("* ").isdigit():
            continue
        name = strip_markdown_bold(row[1]).strip()
        description = strip_markdown_italics(clean_md_links(row[2]))
        mechanical, descriptive = split_spell_description(description)
        spells[name] = Spell(name, mechanical, descriptive)
    return spells


def parse_gear_packages(text: str) -> Dict[str, List[str]]:
    packages: Dict[str, List[str]] = {}
    current: Optional[str] = None
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if line.startswith("### "):
            current = line[4:].strip()
            packages[current] = []
            continue
        if current and line.strip().startswith("*"):
            item = line.strip().lstrip("*").strip()
            packages[current].append(clean_md_links(item))
    return packages


def extract_markdown_table(text: str, header: str) -> List[List[str]]:
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if line.strip() == header.strip():
            start = i + 1
            break
    if start is None:
        raise ValueError(f"Could not find section: {header}")

    # Find first table line.
    while start < len(lines) and "|" not in lines[start]:
        start += 1

    table_lines: List[str] = []
    for line in lines[start:]:
        stripped = line.strip()
        if not stripped:
            if table_lines:
                break
            continue
        if stripped.startswith("#") and table_lines:
            break
        if "|" not in stripped:
            if table_lines:
                break
            continue
        table_lines.append(stripped)

    rows: List[List[str]] = []
    for line in table_lines:
        parts = [p.strip() for p in line.strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", p.replace(" ", "")) for p in parts):
            continue
        rows.append(parts)
    return rows


def parse_item_string(text: str) -> Item:
    original = clean_md_links(text).strip()
    original = strip_markdown_bold(original)
    original = re.sub(r"\s+", " ", original)
    if original.lower() == "none":
        return Item(name="None", slot_override=0)

    if original.lower().endswith("gold pieces"):
        return Item(name=original, slot_override=0)

    special = strip_markdown_italics(re.sub(r"\s*\([^)]*\)\s*$", "", original)).strip()
    special_low = special.lower()
    if special_low == "random spellbook":
        return Item(name="Random Spellbook")
    if special_low == "scroll of random spellbook":
        return Item(name="Scroll of Random Spellbook", tags=["petty"])

    spellbook_match = re.match(r"Spellbook:\s*_?(.+?)_?$", original, flags=re.IGNORECASE)
    if spellbook_match:
        spell_name = strip_markdown_italics(re.sub(r"\s*\([^)]*\)\s*$", "", spellbook_match.group(1))).strip()
        return Item(name=f"Spellbook ({spell_name})")

    scroll_match = re.match(r"Scroll of\s*_?(.+?)_?$", original, flags=re.IGNORECASE)
    if scroll_match:
        spell_name = strip_markdown_italics(re.sub(r"\s*\([^)]*\)\s*$", "", scroll_match.group(1))).strip()
        return Item(name=f"Scroll ({spell_name})", tags=["petty"])

    main = original
    paren = ""
    m = re.match(r"^(.*?)(\([^)]*\))$", original)
    if m:
        main = m.group(1).strip()
        paren = m.group(2)[1:-1].strip()

    tags: List[str] = []
    uses: Optional[int] = None
    charges: Optional[int] = None
    desc_bits: List[str] = []

    if paren:
        raw_bits = split_csv_respecting_parens(paren)
        for bit in raw_bits:
            cleaned = strip_markdown_italics(bit).strip()
            if not cleaned:
                continue
            low = cleaned.lower()
            if m := re.search(r"(\d+)\s*uses", low):
                uses = int(m.group(1))
                tags.append("uses")
                extras = re.sub(r"\d+\s*uses", "", cleaned, flags=re.IGNORECASE).strip(" ,")
                if extras:
                    desc_bits.append(extras)
                continue
            if m := re.search(r"(\d+)\s*charges?", low):
                charges = int(m.group(1))
                tags.append("charges")
                extras = re.sub(r"\d+\s*charges?", "", cleaned, flags=re.IGNORECASE).strip(" ,")
                if extras:
                    desc_bits.append(extras)
                continue
            if re.fullmatch(r"[+]?\d+\s*armor", low):
                tags.append(cleaned.replace("+", ""))
                continue
            if re.fullmatch(r"d\d+(?:\+d\d+)?(?:\s*str\s*damage)?", low):
                tags.append(re.sub(r'\s*damage', '', cleaned, flags=re.IGNORECASE))
                continue
            if low in {"petty", "bulky", "blast", "bonus defense"}:
                tags.append(low if low != "bonus defense" else "bonus defense")
                continue
            desc_bits.append(cleaned)

    item = Item(name=strip_markdown_italics(main).strip(), tags=tags, uses=uses, charges=charges)
    item.description = "; ".join(desc_bits)
    if item.display_name() in TRANSPORT_NAMES:
        item.slot_override = 0
    return item


def split_csv_respecting_parens(text: str) -> List[str]:
    result: List[str] = []
    depth = 0
    current: List[str] = []
    for ch in text:
        if ch == ',' and depth == 0:
            piece = ''.join(current).strip()
            if piece:
                result.append(piece)
            current = []
            continue
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth = max(0, depth - 1)
        current.append(ch)
    piece = ''.join(current).strip()
    if piece:
        result.append(piece)
    return result


def clean_md_links(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    return text.replace("\\_", "_")


def strip_markdown_bold(text: str) -> str:
    return re.sub(r"\*\*(.*?)\*\*", r"\1", text)


def strip_markdown_italics(text: str) -> str:
    text = re.sub(r"_(.*?)_", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    return text


def clean_item_name(text: str) -> str:
    text = strip_markdown_bold(clean_md_links(text))
    text = re.sub(r"\(.*?\)", "", text)
    return strip_markdown_italics(text).strip()


def normalize_name_for_comparison(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def ensure_period(text: str) -> str:
    text = text.strip()
    if not text:
        return text
    return text if text[-1] in ".!?" else text + "."


def normalize_marketplace_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", name.strip())
    return cleaned[:1].upper() + cleaned[1:] if cleaned else cleaned


def roll_dice(rng: random.Random, number: int, sides: int) -> int:
    return sum(rng.randint(1, sides) for _ in range(number))


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)




EMBEDDED_DATA_B64 = """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"""
_EMBEDDED_DIR: Optional[Path] = None

def get_effective_data_dir(user_data_dir: Optional[Path]) -> Path:
    global _EMBEDDED_DIR
    if user_data_dir is not None:
        return user_data_dir
    if _EMBEDDED_DIR is None:
        temp_root = Path(tempfile.mkdtemp(prefix="cairn_char_data_"))
        zip_bytes = base64.b64decode(EMBEDDED_DATA_B64.encode("ascii"))
        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
            zf.extractall(temp_root)
        _EMBEDDED_DIR = temp_root
    return _EMBEDDED_DIR


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Cairn 2e or Barebones characters.")
    parser.add_argument("--version", action="store_true", help="Print the current version and exit")
    parser.add_argument("--update-readme-version", nargs="?", const="README.md", metavar="README", help="Update the README header with the current version and exit")
    parser.add_argument("--data-dir", type=Path, default=None, help="Directory containing the JSON and markdown rules files. If omitted, embedded rules data is used.")
    parser.add_argument("--edition", choices=["2e", "barebones"], default="2e", help="Ruleset to use")
    parser.add_argument("--bg", "--background", dest="background", help="Generate only this background")
    parser.add_argument("--all-backgrounds", action="store_true", help="Generate one character for every background in the chosen edition")
    parser.add_argument("--package", choices=["Fighter", "Thief", "Magic-User", "Cleric"], help="Barebones gear package to use instead of a background roll")
    parser.add_argument("--count", type=int, default=1, help="How many characters to generate")
    parser.add_argument("--omit-background-name", action="store_true", help="Print only the character name in the header")
    parser.add_argument("--seed", type=int, help="Random seed for repeatable output")
    parser.add_argument("--list-backgrounds", action="store_true", help="List available backgrounds for the chosen edition and exit")
    parser.add_argument("--list-packages", action="store_true", help="List barebones gear packages and exit")
    parser.add_argument("--md", "--markdown", dest="md", type=Path, help="Write output to a markdown file instead of stdout")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.version:
        print(f"Heartseed {__version__}")
        return

    if args.update_readme_version:
        update_readme_version(Path(args.update_readme_version))
        print(f"Updated README version: {__version__} -> {args.update_readme_version}")
        return

    rng = random.Random(args.seed)
    resources = SharedResources(get_effective_data_dir(args.data_dir))

    if args.edition == "2e":
        generator = SecondEditionGenerator(resources, rng)
        if args.list_backgrounds:
            print("\n".join(generator.background_names()))
            return
        outputs = run_second_edition(generator, args)
    else:
        generator = BarebonesGenerator(resources, rng)
        if args.list_backgrounds:
            print("\n".join(generator.background_names()))
            return
        if args.list_packages:
            print("\n".join(generator.package_names()))
            return
        outputs = run_barebones(generator, args)

    rendered = "\n\n".join(outputs)
    if args.md:
        args.md.write_text(rendered + ("\n" if not rendered.endswith("\n") else ""), encoding="utf-8")
    else:
        print(rendered)


def run_second_edition(generator: SecondEditionGenerator, args: argparse.Namespace) -> List[str]:
    outputs: List[str] = []
    if args.background:
        for _ in range(args.count):
            outputs.append(generator.generate(args.background).render(omit_background=args.omit_background_name))
        return outputs
    if args.all_backgrounds or args.count == 1:
        for background in generator.background_names():
            outputs.append(generator.generate(background).render(omit_background=args.omit_background_name))
        return outputs
    for _ in range(args.count):
        background = generator.rng.choice(generator.background_names())
        outputs.append(generator.generate(background).render(omit_background=args.omit_background_name))
    return outputs


def run_barebones(generator: BarebonesGenerator, args: argparse.Namespace) -> List[str]:
    outputs: List[str] = []
    if args.package:
        for _ in range(args.count):
            outputs.append(generator.generate_package(args.package).render(omit_background=args.omit_background_name))
        return outputs
    if args.background:
        for _ in range(args.count):
            outputs.append(generator.generate_background(args.background).render(omit_background=args.omit_background_name))
        return outputs
    if args.all_backgrounds:
        for background in generator.background_names():
            outputs.append(generator.generate_background(background).render(omit_background=args.omit_background_name))
        return outputs
    for _ in range(args.count):
        outputs.append(generator.generate_background().render(omit_background=args.omit_background_name))
    return outputs


if __name__ == "__main__":
    main()
