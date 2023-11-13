import re
import json

def convert_markdown_to_json(markdown_data):
    # Extracting the background title and description
    background_title = markdown_data.split('\n', 2)[1].strip('# ').strip()
    image = f"{background_title.lower().replace(' ', '_')}.png"
    background_description = markdown_data.split('\n', 3)[2].strip('> ').strip()

    # Extracting the names
    names_section = markdown_data.split('## Names\n', 1)[1]
    names = names_section.split('\n', 1)[0].strip().split(', ')

    # Extracting Starting Gear
    starting_gear_section = markdown_data.split('## Starting Gear\n\n', 1)[1]
    starting_gear_items = [item.strip('- ').strip() for item in starting_gear_section.split('\n') if item.startswith('-')]

    # Constructing the background items dictionary
    background_items = {}

    # Helper function to extract item details and construct the item dictionary
    def extract_item_details(item):
        item_name = item.split(' (')[0].strip('**')
        item_tags = []
        max_uses = None
        item_details = item[item.find("(")+1:item.find(")")] if '(' in item and ')' in item else ""
        
        # Searching for tags and max_uses in the item details
        for detail in item_details.split(', '):
            if any(tag in detail for tag in ["bulky", "petty", "blast", "Armor"]):
                item_tags.append(detail.split(' ')[0])  # Extracting only the keyword for Armor
            if 'uses' in detail or 'charges' in detail:
                try:
                    max_uses = int(detail.split(' ')[0])
                    item_tags.append('uses')
                except ValueError:  # handles the case where no specific number is given
                    max_uses = None
                    item_tags.append('uses')

        # Adding the item to the background_items dictionary
        background_items[item_name] = {
            "tags": item_tags,
            "max_uses": max_uses,
            "description": ""  # Leave description empty unless a method for recharging is specified
        }

    # Adding starting gear to the background items with their details
    for item in starting_gear_items:
        extract_item_details(item)

    # Extracting tables and their contents
    tables = markdown_data.split('## ')[2:]

    # A dictionary to hold the extracted tables
    extracted_tables = {}

    # Helper function to extract table details
    def extract_table(table_text):
        table_lines = table_text.split('\n')
        table_question = table_lines[0].strip()
        table_options = []
        for line in table_lines[1:]:
            if line.startswith('| **'):
                option_description = line.split('|', 2)[2].strip(' **').strip()
                # Extract items from the options
                items_in_description = []
                if '**' in option_description:
                    item = option_description.split('**')[1]
                    extract_item_details(item)
                    items_in_description.append(item.split(' (')[0].strip())

                # Adding the description and the items to the table options
                table_options.append({
                    "description": option_description,
                    "items": items_in_description,
                    "gold": None  # Assuming there is no gold to extract, adjust if needed
                })
        extracted_tables[table_question] = table_options

    # Extracting details for each table
    for table in tables:
        extract_table(table)

    # Assembling the final JSON structure
    final_json = {
        "background": background_title,
        "image": image,
        "background_description": background_description,
        "names": names,
        "background_items": background_items,
        "starting_gear": starting_gear_items,
        "tables": extracted_tables
    }

    return final_json
