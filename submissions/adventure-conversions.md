---
layout: default
title: Adventure Conversions
nav_order: 3
parent: Submissions
---

# Adventure Conversions

- Copy the following template when submitting an adventure to the Cairn website. 
- Please follow the [Style Guide](/submissions/style-guide) for the text of the conversion. 
- The file should be written in [Markdown](/submissions/submission-guide/#markdown). The filename should be lowercase, and use the *.md suffix (example: cool-adventure.md).
- Make sure the add the "front matter" at the top of the file (the parts starting with the `---` at the beginning) or the submission won't work. For an example, see [here](/adventures/conversions/stellarium-of-the-vinteralf) (raw text [here](https://github.com/yochaigal/cairn/blob/main/adventures/conversions/stellarium-of-the-vinteralf.md)).
- Adventure submissions should _always_ credit the author of the work _as well_ as the name of the person converting the work. 
- Please link to the author, as well as the adventure and (if you're comfortable with it) your own website or contact. 
- If possible, ask for the author's permission. If not, that's OK! We don't generally need it, but it's great to have.

## Submission Template

```
---
layout: default
parent: Conversions
grand_parent: Adventures
title: Adventure Title
nav_exclude: true
search_exclude: true
---

# Adventure Title

- Based on the [original work](link-to-game-page) by [Author Name](link-to-author-site).
- Conversion by [Your Name](link to your contact on the web).

## General Notes
- Put any notes on the conversion here!
- You can list monsters & NPCs separately or by the location they can be found

## Monsters or NPCs

### Monster Name
Monster 1
- Monster special (critical damage, abilities)
- More monster specials, etc.

## Locations
### Location A
#### Weird thing 1
- Notes on weird thing 1

```

Note that the "nav_exclude" and "search_exclude" directives in the Front Matter are for staging purposes only; when the conversion is "complete" they can be removed.