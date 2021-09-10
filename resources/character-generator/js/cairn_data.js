gen_data['character'] = [
  'You are <i> {name} {surname}</i>, formerly {background}. You have {physique} physique, {skin} skin, {hair} hair, and {face} face. You speak in a {speech} manner and wear {clothing} clothing. You are {vice} yet {virtue}, and are generally regarded as {reputation}. You have had the misfortune of being {misfortune}.'
]

gen_data['name'] = [
'Agune'
, 'Beatrice'
, 'Breagan'
, 'Bronwyn'
, 'Cannora'
, 'Drelil'
, 'Elgile'
, 'Esme'
, 'Griya'
, 'Henaine'
, 'Lirann'
, 'Lirathil'
, 'Lisabeth'
, 'Moralil'
, 'Morgwen'
, 'Sybil'
, 'Theune'
, 'Wenain'
, 'Ygwal'
, 'Yslen'
, 'Arwel'
, 'Bevan'
, 'Boroth'
, 'Borrid'
, 'Breagle'
, 'Breglor'
, 'Canhoreal'
, 'Emrys'
, 'Ethex'
, 'Gringle'
, 'Grinwit'
, 'Gruwid'
, 'Gruwth'
, 'Gwestin'
, 'Mannog'
, 'Melnax'
, 'Orthax'
, 'Triunein'
, 'Wenlan'
, 'Yirmeor'
]

gen_data['surname'] = [
'Abernathy'
, 'Addercap'
, 'Burl'
, 'Candlewick'
, 'Cormick'
, 'Crumwaller'
, 'Dunswallow'
, 'Getri'
, 'Glass'
, 'Harkness'
, 'Harper'
, 'Loomer'
, 'Malksmilk'
, 'Smythe'
, 'Sunderman'
, 'Swinney'
, 'Thatcher'
, 'Tolmen'
, 'Weaver'
, 'Wolder'
]

gen_data['background'] = [
  'an alchemist'
,  'a blacksmith'
,  'a butcher'
,  'a burglar'
,  'a carpenter'
,  'a cleric'
,  'a gambler'
,  'a gravedigger'
,  'an herbalist'
,  'a hunter'
,  'a magician'
,  'a mercenary'
,  'a merchant'
,  'a miner'
, 'an outlaw'
,  'a performer'
,  'a pickpocket'
,  'a smuggler'
,  'a servant'
,  'a ranger'
]

gen_data['physique'] = [
  'a statuesque'
,  'a brawny'
,  'a towering'
,  'a stout'
,  'a rugged'
,  'an athletic'
,  'a lanky'
,  'a short'
,  'a scrawny'
,  'a flabby'
]

gen_data['skin'] = [
  'dark'
,  'a birthmark on your'
,  'tanned'
,  'pockmarked'
,  'weathered'
,  'oily'
,  'pale'
,  'perfect'
,  'rosy'
,  'tattooed'
]

gen_data['hair'] = [
  'bald'
,  'braided'
,  'oily'
,  'wavy'
,  'curly'
,  'long'
,  'wispy'
,  'filthy'
,  'frizzy'
,  'luxurious'
]

gen_data['face'] = [
  'a chiseled'
,  'a square'
,  'a bony'
,  'a sharp'
,  'a sunken'
,  'an elongated'
,  'a broken'
,  'a soft'
,  'a rat-like'
,  'a round'
]

gen_data['speech'] = [
  'blunt'
,  'booming'
,  'droning'
,  'gravelly'
,  'cryptic'
,  'formal'
,  'stuttering'
,  'precise'
,  'squeaky'
,  'whispery'
]

gen_data['clothing'] = [
  'antique'
,  'bloody'
,  'rancid'
,  'soiled'
,  'frumpy'
,  'elegant'
,  'frayed'
,  'foreign'
,  'livery'
,  'filthy'
]

gen_data['virtue'] = [
  'ambitious'
,  'courageous'
,  'disciplined'
,  'honorable'
,  'serene'
,  'merciful'
,  'humble'
,  'tolerant'
,  'gregarious'
,  'cautious'
]

gen_data['vice'] = [
  'aggressive'
,  'bitter'
,  'craven'
,  'deceitful'
,  'greedy'
,  'vengeful'
,  'lazy'
,  'nervous'
,  'rude'
,  'vain'
]

gen_data['reputation'] = [
  'an oddball'
,  'wise'
,  'respected'
,  'ambitious'
,  'repulsive'
,  'dangerous'
,  'honest'
,  'a boor'
,  'a loafer'
,  'an entertainer'
]

gen_data['misfortune'] = [
  'abandoned'
,  'addicted'
,  'blackmailed'
,  'condemned'
,  'cursed'
,  'abandoned'
,  'addicted'
,  'blackmailed'
,  'condemned'
,  'cursed'
]

gen_data['equipment'] = [
  'armor: {armor}<br>Helmet/Shield: {helmet}<br>Weapons: {weapons}<br>Items: {tool,gear,trinket}<br>Bonus item: {bonus}'
]
gen_data['armor'] = {
  '1-3': 'No upper body protection',
  '4-14': 'Brigandine (1 Armor, bulky)',
  '15-19': 'Chainmail (2 Armor, bulky)',
  '20': 'Plate (3 Armor, bulky)'
}

gen_data['helmet'] = {
  '1-13': ', no helmet nor shield',
  '14-16': ', a Helmet (+1 Armor)',
  '17-19': ', a Shield (+1 Armor)',
  '20': ', a Helmet (+1 Armor) and a Shield (+1 Armor)'
}

gen_data['weapons'] = {
'1-10':'{wgroup1}',
'11-14':'{wgroup2}',
'15-19':'{wgroup3}',
'20':'{wgroup4}'
}

gen_data['wgroup1'] = ['Dagger', 'Cudgel', 'Staff']
gen_data['wgroup2'] = ['Sword', 'Mace', 'Axe']
gen_data['wgroup3'] = ['Longbow (bulky)', 'Crossbow (bulky)', 'Sling']
gen_data['wgroup4'] = ['Halberd (bulky)', 'War Hammer (bulky)', 'Battleaxe (bulky)']

gen_data['armor_weapons'] = {
  '1-10':'{armor}',
  '11-20':'{weapons}'
}

gen_data['tool_trinket'] = {
  '1-10':'{tool}',
  '11-20':'{trinket}'
}

gen_data['bonus'] = {
  '1-6': '{tool_trinket}',
  '7-13': '{gear}',
  '14-17': '{armor_weapons}',
  '18-20': 'Spellbook containing the spell \'{spellbook}\''
}

gen_data['tool'] = [
  'Bellows'
  ,  'Bucket (stacks)'
  ,  'Caltrops'
  ,  'Chalk'
  ,  'Chisel'
  ,  'Cook Pots'
  ,  'Crowbar'
  ,  'Drill (Manual)'
  ,  'FishingRod'
  ,  'Glue (stacks)'
  ,  'Grease'
  ,  'Hammer'
  ,  'Hourglass'
  ,  'Metal File (stacks)'
  ,  'Nails (stacks)'
  ,  'Net (stacks)'
  ,  'Saw'
  ,  'Sealant'
  ,  'Shovel'
  ,  'Tongs'
]

gen_data['trinket'] = [
  'Bottle'
,  'Card Deck (stacks)'
,  'Dice Set (stacks)'
,  'Face Paint'
,  'Fake Jewels (stacks)'
,  'Horn'
,  'Incense (stacks)'
,  'Instrument'
,  'Lens'
,  'Marbles (stacks)'
,  'Mirror'
,  'Perfume'
,  'Quill &  Ink'
,  'Salt Pack (stacks)'
,  'Small Bell'
,  'Soap (stacks)'
,  'Sponge'
,  'Tar Pot'
,  'Twine (stacks)'
,  'Whistle'
]

gen_data['gear'] = [
  'Air Bladder'
,  'Antitoxin'
,  'Cart (+4 slots, bulky)'
,  'Chain (10ft)'
,  'Dowsing Rod'
,  'Fire Oil'
,  'Grappling Hook '
,  'Large Sack'
,  'Large Trap'
,  'Lockpicks'
,  'Manacles'
,  'Pick'
,  'Pole (10ft)'
,  'Pulley'
,  'Repellent'
,  'Rope (25ft)'
,  'Spirit Ward'
,  'Spyglass'
,  'Tinderbox'
,  'Wolfsbane '
]

gen_data['spellbook'] = [
  'Adhere'
,  'Anchor'
,  'Animate Object'
,  'Anthropomorphize'
,  'Arcane Eye'
,  'Astral Prison'
,  'Attract'
,  'Auditory Illusion'
,  'Babble'
,  'Bait Flower'
,  'Beast Form'
,  'Befuddle'
,  'Body Swap'
,  'Charm'
,  'Command'
,  'Comprehend'
,  'Cone of Foam'
,  'Control Plants'
,  'Control Weather'
,  'Cure Wounds'
,  'Deafen'
,  'Detect Magic'
,  'Disassemble'
,  'Disguise'
,  'Displace'
,  'Earthquake'
,  'Elasticity'
,  'Elemental Wall'
,  'Filch'
,  'Flare'
,  'Fog Cloud'
,  'Frenzy'
,  'Gate'
,  'Gravity Shift'
,  'Greed'
,  'Haste'
,  'Hatred'
,  'Hear Whispers'
,  'Hover'
,  'Hypnotize'
,  'Icy Touch'
,  'Identify Owner'
,  'Illuminate'
,  'Invisible Tether'
,  'Knock'
,  'Leap'
,  'Liquid Air'
,  'Magic Dampener'
,  'Manse'
,  'Marble Craze'
,  'Masquerade'
,  'Miniaturize'
,  'Mirror Image'
,  'Mirrorwalk'
,  'Multiarm'
,  'Night Sphere'
,  'Objectify'
,  'Ooze Form'
,  'Pacify'
,  'Phobia'
,  'Pit'
,  'Primal Surge'
,  'Push/Pull'
,  'Raise Dead'
,  'Raise Spirit'
,  'Read Mind'
,  'Repel'
,  'Scry'
,  'Sculpt Elements'
,  'Sense'
,  'Missile Shield'
,  'Shroud'
,  'Shuffle'
,  'Sleep'
,  'Slick'
,  'Smoke Form'
,  'Sniff'
,  'Snuff'
,  'Sort'
,  'Spectacle'
,  'Spellsaw'
,  'Spider Climb'
,  'Summon Cube'
,  'Swarm'
,  'Telekinesis'
,  'Telepathy'
,  'Teleport'
,  'Target Lure'
,  'Thicket'
,  'Summon Idol'
,  'Time Control'
,  'True Sight'
,  'Upwell'
,  'Vision'
,  'Visual Illusion'
,  'Ward'
,  'Web'
,  'Widget'
,  'Wizard Mark'
,  'X-Ray Vision'
]
