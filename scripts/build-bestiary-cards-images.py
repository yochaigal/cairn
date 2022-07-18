# -*- coding: UTF-8 -*-
# Written by Oskar Swida
# This creates monster cards from original monsters in markdown format


import glob
from textwrap import wrap

import marko
from lxml import html
from marko.ast_renderer import ASTRenderer
from PIL import Image, ImageDraw, ImageFont


class Coords:
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height


class TextBox:
    def __init__(self, coords):
        self.coords = coords

    def compute_font_size(self, text, font_name, initial_size=64):
        fnt = ImageFont.truetype(font_name, initial_size)
        fs = initial_size
        fsize = fnt.getsize_multiline(text)
        if fsize[0] < self.coords.width and fsize[1] < self.coords.height:
            return fs, text.splitlines()
        lines = text.splitlines()
        outl = []
        while fsize[0] >= self.coords.width or fsize[1] >= self.coords.height:
            fs = fs - 1
            fnt = ImageFont.truetype(font_name, fs)
            cw = fnt.getsize("o")
            line_width = int(self.coords.width/cw[0])+1
            outl = []
            for l in lines:
                wrapped = wrap(
                    l, line_width, replace_whitespace=False, break_long_words=True)
                for x in wrapped:
                    outl.append(x)
            fsize = fnt.getsize_multiline("\n".join(outl))

        return fs, outl

    def drawText(self, image, text, font_name, center=False, angle=0, initial_size=64):
        canvas = ImageDraw.Draw(image)
        fs, lines = self.compute_font_size(
            text, font_name=font_name, initial_size=initial_size)
        fnt = ImageFont.truetype(font_name, fs)
        cnt = 0
        ch = fnt.getsize("gh")
        fsize = fnt.getsize_multiline("\n".join(lines))
        if angle != 0:
            img_txt = Image.new('L', fsize, color=(255))
            draw_txt = ImageDraw.Draw(img_txt)
            for l in lines:
                isize = fnt.getsize(l)
                # experimental results
                y = cnt*ch[1]*0.75 - ch[1]/6
                if center:
                    x = (fsize[0] - isize[0])/2
                else:
                    x = 0
                draw_txt.text((x, y), l, "black", font=fnt)
                cnt = cnt + 1
            img_txt = img_txt.rotate(angle, expand=1)
            sx, sy = img_txt.size
            # in fact only for 90 degree angle, require computation
            y = self.coords.y+int((self.coords.width-fsize[0])/2)
            image.paste(img_txt, (self.coords.x, y, self.coords.x+sx, y+sy))
        else:
            for l in lines:
                y = self.coords.y + cnt*ch[1]*0.8
                if center:
                    x = self.coords.x + (self.coords.width - fsize[0])/2
                else:
                    x = self.coords.x
                canvas.text((x, y), l, (0, 0, 0), font=fnt)
                cnt = cnt + 1


class MonsterCard:
    def __init__(self, outdir):
        self.titleCoords = Coords(19, 79, 314, 67)
        self.titleBox = TextBox(self.titleCoords)
        self.attrCoords = Coords(115, 35, 490, 82)
        self.attrBox = TextBox(self.attrCoords)
        self.descCoords = Coords(117, 146, 502, 292)
        self.descBox = TextBox(self.descCoords)
        self.outdir = outdir

    def generate(self, mdfile):
        self.image = Image.open("sources/monster-ls.png")
        text_file = open(mdfile, "r", encoding="utf-8")
        data = text_file.read()
        text_file.close()
        res = marko.convert(data)
        # replace formatting because xpath engine seems not to respect descendant axis
        res = res.replace("<em>", "", -1).replace("</em>", "", -1)
        tree = html.fromstring(res)
        title = tree.xpath('//h1/text()')
        if title == None or len(title) == 0:
            print("PANIC! Cannot find title in", data)
            return
        paragraphs = tree.xpath('//p/text()')
        if paragraphs == None or len(paragraphs) == 0:
            print("PANIC! Cannot find traits line in", data)
            return
        desclines = tree.xpath('//ul/li/text()')
        if desclines == None or len(desclines) == 0:
            print("PANIC! Cannot find description list in", data)
            return
        desc = []
        for d in desclines:
            d = d.replace("\n", " ", -1)
            desc.append("• "+d)
        self.attrBox.drawText(
            self.image, paragraphs[0], '/home/yochai/github/cairn/scripts/fonts/Alegreya-Italic.ttf', center=True, initial_size=56)
        self.titleBox.drawText(
            self.image, title[0], '/home/yochai/github/cairn/scripts/fonts/Alegreya-Bold.ttf', angle=90, center=True)
        self.descBox.drawText(self.image, "\n".join(
            desc), '/home/yochai/github/cairn/scripts/fonts/Alegreya-Regular.ttf', initial_size=40)
        self.image.save(self.outdir+"/"+title[0]+".png")
        pass


# Please adjust to your monster markdown & output directory
dir = "/home/yochai/github/cairn/resources/monsters"
filelist = [f for f in glob.glob(dir + "/*.md")]
cnt = 0
for file in filelist:
    mc = MonsterCard("/home/yochai/Google Drive/Games/OSR/Into The Odd/hacks/Cairn/Monsters/cairn-bestiary-cards")
    mc.generate(file)
