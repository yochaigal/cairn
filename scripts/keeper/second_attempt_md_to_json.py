import re

def extract_item_details(description):
    """Extracts items and their details (e.g., max uses, tags) from a description."""
    items = []
    item_details = {}
    
    # Extract item names surrounded by ** and their details
    for match in re.finditer(r"\*\*([\w\s-]+)\*\*(?:\s\((\d+)\suses\))?", description):
        item_name = match.group(1).strip()
        items.append(item_name)
        max_uses = int(match.group(2)) if match.group(2) else None
        tags = re.findall(r"\(([\w\s-]+)\)", description)
        
        # Remove number from tags, if present
        tags = [tag for tag in tags if not tag.isdigit()]
        
        item_details[item_name] = {
            "tags": tags,
            "max_uses": max_uses,
            "description": ""
        }

    # Remove markdown formatting
    description = re.sub(r"[_*\[\]]", "", description).strip()

    return items, item_details, description

def extract_from_markdown(md_content):
    """Extracts relevant data from provided markdown content."""
    # Extracting title and description
    title_match = re.search(r"# (\w+)", md_content)
    title = title_match.group(1) if title_match else None
    description_match = re.search(r"> (.+?)\n", md_content)
    description = description_match.group(1) if description_match else None
    
    # Extracting names and starting gear
    names_match = re.search(r"## Names\n(.+?)\n\n", md_content, re.DOTALL)
    names_list = names_match.group(1).split(", ") if names_match else []
    gear_match = re.search(r"## Starting Gear\n\n(.+?)\n\n", md_content, re.DOTALL)
    gear_list = [item.split(" (")[0].strip("- ").strip() for item in gear_match.group(1).split("\n")] if gear_match else []
    
    # Extracting table data
    table_matches = re.findall(r"## (.+?)\n\n(\| .+? \|\n)+", md_content, re.DOTALL)
    tables = {}
    background_items = {}

    for table in table_matches:
        question = table[0]
        table_rows = re.findall(r"^\| \*\*(\d+)\*\* \| (.+?) \|\n", table[1], re.MULTILINE)
        options = []
        for row in table_rows:
            items, item_details, cleaned_description = extract_item_details(row[1])
            options.append({
                "description": cleaned_description,
                "items": items,
                "gold": 0
            })
            background_items.update(item_details)
        table_name = f"table{len(tables) + 1}"
        tables[table_name] = {
            "question": question,
            "options": options
        }

    # Assembling the final structure
    data = {
        "background": title,
        "image": f"{title.lower()}.png",
        "background_description": description,
        "names": names_list,
        "background_items": background_items,
        "starting_gear": gear_list
    }
    data.update(tables)

    return data
