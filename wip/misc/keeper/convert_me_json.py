import re
import json

def load_markdown_file(filepath):
    with open(filepath, 'r') as file:
        return file.read()

def save_json_file(data, filepath):
    with open(filepath, 'w') as file:
        json.dump(data, file, indent=4)

def clean_description(description):
    # Remove markdown syntax like "**" and "_"
    return description.replace("**", "").replace("_", "")

def extract_items(description):
    # Extract items from the description using regex
    item_regex = re.compile(r'\*\*([^*]+)\*\*')
    items = item_regex.findall(description)

    # Clean the description by removing markdown syntax
    cleaned_description = clean_description(description)

    return items, cleaned_description

def parse_markdown_to_json_with_all_items(markdown_content):
    # Initialize the JSON structure based on the observed format
    json_data = {
        "background": "",
        "image": "",
        "background_description": "",
        "names": [],
        "background_items": {},
        "starting_gear": [],
        "table1": {},
        "table2": {}
    }
    
    # Split the markdown content into lines
    lines = markdown_content.split('\n')
    
    # Regular expressions to identify sections
    title_regex = re.compile(r'^# (.+)')
    description_regex = re.compile(r'^> (.+)')
    names_regex = re.compile(r'^## Names')
    gear_regex = re.compile(r'^## Starting Gear')
    table_regex = re.compile(r'^## (.+):')
    table_option_regex = re.compile(r'^\|\s*\*\*(\d+)\*\*\s*\|\s*(.+?)\s*\|')
    tags_regex = re.compile(r'\b(bulky|petty|blast|d4|d6|d8|d10|d12|d6\+d6|uses)\b')
    
    # Variables to track the current section and table count
    current_section = None
    table_count = 0
    
    for line in lines:
        # Check for title
        title_match = title_regex.match(line)
        if title_match:
            json_data["background"] = title_match.group(1).strip()
            json_data["image"] = f"{json_data['background'].lower().replace(' ', '-')}.png"
            continue

        # Check for description
        description_match = description_regex.match(line)
        if description_match:
            json_data["background_description"] = clean_description(description_match.group(1).strip())
            continue
        
        # Check for names section
        if names_regex.match(line):
            current_section = "names"
            continue
        
        # Check for starting gear section
        if gear_regex.match(line):
            current_section = "gear"
            continue
        
        # Check for table section
        table_match = table_regex.match(line)
        if table_match:
            current_section = "table"
            table_count += 1
            current_table_key = f"table{table_count}"
            json_data[current_table_key] = {
                "question": clean_description(table_match.group(1).strip()),
                "options": []
            }
            continue
        
        # Process names
        if current_section == "names" and line.strip():
            json_data["names"].extend([name.strip() for name in line.split(',')])
        
        # Process gear and add items to "starting_gear" and "background_items"
        if current_section == "gear" and line.strip():
            # Gear items can be in the format: "- Item name (details)" or "- Item name"
            item_match = re.match(r'^- ([^(]+)(?: \((.+)\))?', line)
            if item_match:
                item_name = item_match.group(1).strip()
                json_data["starting_gear"].append(item_name)
                item_details = item_match.group(2).strip() if item_match.group(2) else ""
                # Parse details into tags
                tags = tags_regex.findall(item_details)
                max_uses = None
                # If details contain "uses", consider it as max_uses
                if "uses" in tags:
                    max_uses_index = tags.index("uses")
                    tags.pop(max_uses_index)  # Remove "uses" from tags
                    max_uses_match = re.search(r'\d+', item_details)
                    max_uses = int(max_uses_match.group()) if max_uses_match else None
                json_data["background_items"][item_name] = {
                    "tags": tags,
                    "max_uses": max_uses,
                    "description": ""
                }
        
        # Process table options and add items to "background_items"
        if current_section == "table" and line.strip():
            option_match = table_option_regex.match(line)
            if option_match:
                # Clean the description and extract items
                items, cleaned_description = extract_items(option_match.group(2).strip())
                json_data[current_table_key]["options"].append({
                    "description": cleaned_description,
                    "items": items,
                    "gold": 0
                })
                # Also add items to "background_items"
                for item in items:
                    if item not in json_data["background_items"]:
                        json_data["background_items"][item] = {
                            "tags": [],
                            "max_uses": None,
                            "description": ""
                        }
    
    # Return the JSON data
    return json_data

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python markdown_to_json_converter.py input_file.md output_file.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]

    # Load the markdown content
    markdown_content = load_markdown_file(input_file)

    # Convert the markdown content to JSON
    json_data = parse_markdown_to_json_with_all_items(markdown_content)

    # Save the JSON data to a file
    save_json_file(json_data, output_file)
