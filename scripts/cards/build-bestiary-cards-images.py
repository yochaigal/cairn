#!/usr/bin/python
# -*- coding: utf-8 -*-

# Written by Oskar Świda
# This is a new script which creates monster cards 
# from original monsters in markdown format

import glob
import mistletoe
from mistletoe.ast_renderer import ASTRenderer
import json
from PIL import Image, ImageDraw, ImageFont
import re
from textwrap import wrap



# Please adjust to your monster markdown & output directory

monster_defs = "/home/yochai/github/cairn/resources/monsters/"           # monsters definitions directory
monster_files = "/*.md"                             # selected monsters to generate
output_dir = "/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards"     # output directory
background_image = "/home/yochai/github/cairn/scripts/sources/monster-ls.png"      # card background image
font_dir = "/home/yochai/github/cairn/scripts/fonts" # font directory


# ------------  Generate single monster card

class TextBlock:
    def __init__(self, content, bold, italic):
        self.content = content
        self.bold = bold
        self.italic = italic
        
    def __str__(self):
        return self.content + ',' + str(self.bold) + ',' + str(self.italic)
    
class Trait:
    def __init__(self, blocks):
        self.blocks = [TextBlock("• ",False,False)]
        self.blocks += blocks
        
    def __str__(self):
        r = ""
        for b in self.blocks:
            r += str(b)
        return r
    
class CardParser:
    
    def __init__(self):
        self.card_title = ""
        self.card_attrs = []
        self.card_traits = []
        pass
        
    def print_data(self):
        print('title:',self.card_title)
        print('attrs:',self.attr_text())
        print('traits:')
        for t in self.card_traits:
            print(t)
    
    def skip_item(self, item):
        if item['type'] == 'ThematicBreak':
            return True
        if 'level' in item and item['level'] == 2:
            return True
        return False
    
    def parse_block(self, item):
        if item['type'] == 'Paragraph':
            blocks = []
            for c in item['children']:
                blocks += self.parse_block(c)
            return blocks
        elif item['type'] == 'RawText':
            return [TextBlock(item['content'], False, False)]
        elif item['type'] == 'Strong':
            blocks = []
            for cc in item['children']:
                if cc['type'] == 'RawText':
                    blocks += [TextBlock(cc['content'], True, False)]
            return blocks
        elif item['type'] == 'Emphasis':
            blocks = []
            for cc in item['children']:
                if cc['type'] == 'RawText':
                    blocks += [TextBlock(cc['content'], False, True)]
            return blocks
        return []
    
    def parse(self, file):
        with open(file, 'r') as fin:
            md = mistletoe.markdown(fin, ASTRenderer)
            rendered = json.loads(md)
            for item in rendered['children']:
                if self.skip_item(item):
                    pass
                elif item['type'] == 'Heading':
                    for c in item['children']:
                        if c['type'] == 'RawText':
                            self.card_title = c['content']
                elif item['type'] == 'Paragraph':
                    attrs = []
                    if item['type'] == 'RawText':
                        attrs += [TextBlock(item['content'], False, False)]
                    elif 'children' in item:
                        for c in item['children']:
                            attrs += self.parse_block(c)
                    self.card_attrs = attrs                    
                elif item['type'] == 'List':
                    traits = []
                    for c in item['children']:                        
                        for c2 in c['children']:
                            traits += [Trait(self.parse_block(c2))]
                    self.card_traits = traits
                else:
                    print('ERROR: unknown description element: ',item)
            
    def trait_blocks(self):
        b = []
        for t in self.card_traits:
            b += t.blocks
        return b
    
    def attr_text(self):
        r = ""
        for a in self.card_attrs:
            r += a.content
        return r
        
    def prepare(self, input):
        self.parse(input)
        pass
    
    
# Generate image from single card class    
    
class ImageGenerator:
    
    def __init__(self, card):
        self.card = card
        self.titleCoords = [16, 79, 315, 70]
        self.attrCoords = [115, 30, 480, 90]
        self.descCoords = [115, 146, 520, 290]
        self.font_italic = font_dir + '/' + 'Alegreya-Italic.ttf'
        self.font_regular = font_dir + '/' + 'Alegreya-Regular.ttf'
        self.font_bold = font_dir + '/' + 'Alegreya-Bold.ttf'

    def simulate_draw_text(self, text, box, font, angle, center, size, force_single,correct_abilities):
        width = box[2]
        height = box[3]
        canvas = ImageDraw.Draw(self.image)
        fnt = ImageFont.truetype(font, size)
         # line width in chars
        cb = fnt.getbbox('o')
        cw = [cb[2] - cb[0], cb[3]-cb[1]]
        line_width_chars = int(box[2] / cw[0]) + 1
        if force_single and line_width_chars < len(text):
            return ("",False,0,0)
        # wrap lines in box
        wrapped_lines = []
        wrapped_lines += wrap(text, line_width_chars, replace_whitespace=False,
                               break_long_words=False)
        if correct_abilities and len(wrapped_lines) > 1:
            t = wrapped_lines[0]
            pos = len(wrapped_lines[0]) - 1
            while t[pos] == ' ':
                pos -= 1
            if t[pos].isdigit():
                while pos > 0 and t[pos].isdigit():
                    pos -= 1
                if pos > 0:
                    x = t[pos:]
                    wrapped_lines[0] = wrapped_lines[0][:pos]
                    wrapped_lines[1] = x+" "+wrapped_lines[1]                    
        txt = "\n".join(wrapped_lines)
        if force_single:
            bbox = canvas.textbbox((box[0],box[1]),txt,font=fnt)
        else:
            bbox = canvas.multiline_textbbox((box[0],box[1]),txt,font=fnt)
        w = bbox[2]-bbox[0]
        h = bbox[3]-bbox[1]
        if w > width or h > height:
            return ("",False,0,0)
        return (txt, True, w, h)  
        
    def draw_text(self, text, box, font, angle, center, size, force_single, correct_abilities):
        canvas = ImageDraw.Draw(self.image)
        s = size
        (txt, success,w,h) = self.simulate_draw_text(text, box, font, angle, center, s, force_single, correct_abilities)
        while not success:
            s = s - 1
            (txt, success,w,h) = self.simulate_draw_text(text, box, font, angle, center, s, force_single, correct_abilities)
        
        fnt = ImageFont.truetype(font, s)
        text_center = (int((box[2]-w)/2), int((box[3]-h)/2))
        lines_count = len(txt.split("\n"))
        
        if angle != 0:
            img_txt = Image.new('L', (box[2],box[3]), color=255)
            draw_txt = ImageDraw.Draw(img_txt)
            if center:
                if lines_count > 1:
                    draw_txt.multiline_text(text_center,txt,font=fnt, fill="#000000")
                else:
                    draw_txt.text(text_center,txt,font=fnt, fill="#000000",anchor="lt")
            else:
                if lines_count > 1:
                    draw_txt.multiline_text((0,0),txt,font=fnt, fill="#000000")
                else:
                    draw_txt.text((0,0),txt,font=fnt, fill="#000000")
            img_txt = img_txt.rotate(angle, expand=1)
            self.image.paste(img_txt, (box[0],box[1]))
        else:
            if center:
                if lines_count > 1:
                    canvas.multiline_text((box[0]+text_center[0],box[1]+text_center[1]-int(s/3)),txt,font=fnt,fill="#000000")
                else:
                    canvas.text((box[0]+text_center[0],box[1]+text_center[1]),txt,font=fnt,fill="#000000", anchor="lt")
            else:
                if lines_count > 1:
                    canvas.multiline_text((box[0],box[1]),txt,font=fnt, fill="#000000")
                else:
                    canvas.text((box[0],box[1]),txt,font=fnt, fill="#000000", anchor="lt")
    
    def simulate_draw_traits(self,font, size):
        box = self.descCoords
        width = box[2]
        height = box[3]
        canvas = ImageDraw.Draw(self.image)
        fnt = ImageFont.truetype(font, size) # todo compute font
        # line width in chars
        cb = fnt.getbbox('o')
        cw = [cb[2] - cb[0], cb[3]-cb[1]]
        line_width_chars = int(box[2] / cw[0]) + 1
        # total trait lines
        lines = []
        ext = 0
        for t in self.card.card_traits:
            line = ""
            for b in t.blocks:
                if b.bold:
                    line += '▪'+b.content+'▪'
                    ext = 2
                elif b.italic:
                    line += '▫'+b.content+'▫'
                    ext = 2
                else:
                    line += b.content
            lines += [line]
        # wrap lines in box
        wrapped_lines = []
        for l in lines:
            wrapped_lines += wrap(l, line_width_chars+ext, replace_whitespace=False,
                               break_long_words=False)
        txt = "\n".join(wrapped_lines)
        bbox = canvas.multiline_textbbox((box[0],box[1]),txt,font=fnt)
        w = bbox[2]-bbox[0]
        h = bbox[3]-bbox[1]
        if w > width+cw[0] or h > height:
            return ("",False,[])
        ll = []
        for wl in wrapped_lines:
            ll += [len(wl)]
        return (txt, True, ll)             

    def draw_traits(self, font, start_size):
        font = self.font_regular
        s = start_size
        (txt, success, lens) = self.simulate_draw_traits(font, s)
        while not success:
            s = s - 1
            (txt, success,lens) = self.simulate_draw_traits(font, s)
        box = self.descCoords
        canvas = ImageDraw.Draw(self.image)
        fnt_regular = ImageFont.truetype(self.font_regular, s)
        fnt_bold = ImageFont.truetype(self.font_bold, s)
        fnt_italic = ImageFont.truetype(self.font_italic, s)
        lines = txt.split("\n")
        # determine line height
        cb = fnt_bold.getbbox('W')
        ch = [cb[2] - cb[0], cb[3]-cb[1]]
        line_height = int(1.7*ch[1])
        pos = 0
        current_font = fnt_regular
        bold = False
        italic = False
        for line in lines:
            y = box[1]+(pos*line_height)
            xpos = 0
            rest = line
            while rest != "":
                cursor = rest.find('▪')
                if cursor == -1:
                    cursor = rest.find('▫')
                    if cursor != -1:
                        italic = not italic
                    else:
                        canvas.multiline_text((box[0]+xpos,y),rest,font=current_font, fill="#000000")
                        rest = ""
                        continue                    
                else:
                    bold = not bold
                t = rest[:cursor]
                canvas.multiline_text((box[0]+xpos,y),t,font=current_font, fill="#000000")
                rest = rest[cursor+1:]
                bbox = canvas.multiline_textbbox((0,0),t,font=current_font)
                w = bbox[2]-bbox[0]
                h = bbox[3]-bbox[1]
                xpos += w
                if bold:
                    current_font = fnt_bold
                elif italic:
                    current_font = fnt_italic
                else:
                    current_font = fnt_regular
            pos += 1
        
    
    def generate(self, out):
        self.image = Image.open(background_image)
        self.draw_text(self.card.card_title.strip(),self.titleCoords,self.font_bold, angle=90, center=True,size=64, force_single=True, correct_abilities=False)
        self.draw_text(self.card.attr_text(),self.attrCoords,self.font_italic, angle=0, center=True,size=64, force_single=False, correct_abilities=True)
        self.draw_traits(self.font_regular,64)
        self.image.save(out + '/' + self.card.card_title + '.png')
        pass
    pass


# main

filelist = [f for f in glob.glob(monster_defs + monster_files)]
cnt = 0
for file in filelist:
    mc = CardParser()
    mc.prepare(file)
    ig = ImageGenerator(mc)
    ig.generate(output_dir)
