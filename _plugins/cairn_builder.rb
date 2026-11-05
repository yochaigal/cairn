# frozen_string_literal: true

require "json"

# The character builder's data ("Roll a Character right now!" on Character Creation), read at build time from
# Character Creation and the 20 background pages into site.data["cairn_builder"]: each background's quote, names,
# starting gear and two d6 tables, the trait, bond and omen tables, and a drafted guess at what each row does to the
# character (items, gold, HP, bonds, omens). _data/cairn_builder_fixes.yml corrects the guesses where they're wrong.
#
# When Yochai edits a background, the next build picks it up. If a page no longer has the shape the builder needs
# (10 names and two d6 tables, 20 backgrounds, 10 of each trait, 20 bonds and omens), the build logs a warning and
# the builder is left off Character Creation; the site still builds.
module Cairn
  class Builder < Jekyll::Generator
    safe true
    priority :low

    CC = "second-edition/players-guide/character-creation.md"
    TRAITS = %w[Physique Skin Hair Face Speech Clothing Virtue Vice].freeze
    # bold names that aren't things a character carries (people, places, orders, rules)
    NOT_ITEMS = ["war", "falconry", "recharge", "fatigue", "critical damage", "gate", "lord of winter", "dawn brigade", "moss witch",
                 "single item", "specialty", "omens", "bonds", "str", "dex", "wil", "hp", "deprived", "panicked", "oak lord", "oak lord's",
                 "warden", "armor", "gold", "gp", "lead", "fake", "enthralled"].freeze
    TAG = /\(([^()]*)\)/.freeze

    class Shape < StandardError; end

    def generate(site)
      @site = site
      @pages = site.pages.to_h { |p| [p.path, p] }
      @fixes = site.data["cairn_builder_fixes"] || {}
      data = builder_data
      cards = site.data["cairn_builder_cards"]
      raise Shape, "_data/cairn_builder_cards.json is missing" unless cards
      data["cards"] = cards
      site.data["cairn_builder"] = data
    rescue Shape => e
      Jekyll.logger.warn("cairn_builder:", "#{e.message}; the character builder is left off Character Creation")
      site.data["cairn_builder"] = nil
    end

    private

    def body(rel)
      page = @pages[rel] or raise Shape, "#{rel} is missing"
      page.content
    end

    def plain(s)
      s.to_s.gsub(/!?\[([^\]]*)\]\([^)]+\)/, '\1').gsub(/[*_]/, "").gsub(/\\(.)/, '\1').strip
    end

    def table_rows(lines)
      rows = lines.map { |l| l.strip.sub(/\A\|/, "").sub(/\|\z/, "").split("|", -1).map(&:strip) }
      rows.reject { |r| r.all? { |c| c.match?(/\A:?-+:?\z/) } }
    end

    def md_table(lines)
      rows = table_rows(lines)
      [rows[0].map { |c| plain(c) }, rows[1..] || []]
    end

    def number(cell)
      m = cell.match(/\A\s*\**\s*(\d+)\s*\**\s*\z/)
      m && m[1].to_i
    end

    # a d-table written as column pairs (| d20 | Background | d20 | Background |): {number => cell}
    def pairs(lines)
      out = {}
      md_table(lines)[1].each do |r|
        (0...(r.size - 1)).step(2) do |i|
          n = number(r[i])
          out[n] = r[i + 1].strip if n
        end
      end
      out
    end

    # the lines under a heading, up to the next heading of the same or a higher level
    def section_lines(text, title, level = 2)
      m = text.match(/^#{'#' * level} #{Regexp.escape(title)}\s*$/)
      return [] unless m
      rest = text[m.end(0)..]
      fin = rest.match(/^\#{1,#{level}} /)
      (fin ? rest[0...fin.begin(0)] : rest).lines.map(&:chomp)
    end

    def table_lines(text, title, level = 2) = section_lines(text, title, level).select { |l| l.strip.start_with?("|") }

    def item(name, tags = {}) = {"name" => name}.merge(tags)

    def tags_of(t)
      t = t.downcase.tr("_", " ")  # _bulky_
      out = {}
      out["petty"] = true if t.match?(/\bpetty\b/)
      out["bulky"] = true if t.match?(/\bbulky\b/)
      if (m = t.match(/\+?(\d)\s*armor/))
        out["armor"] = m[1].to_i
      end
      out
    end

    # a drafted guess at what a table cell does to the character: {items, gold, hp, bonds, omen, marketplace}
    def effects(t)
      fx = {"items" => [], "gold" => 0, "hp" => nil, "bonds" => 0, "omen" => false, "marketplace" => nil}
      # money first, so "an extra 20gp" isn't also an item; an item's own value ("(20gp)", "worth 200gp") isn't money
      t.scan(/(?:take|gain|receive|pocket|keep|start with|plus|and)\s+(?:an?\s+)?(?:extra\s+)?\**\s*(\d+)\s*gp\b(?!\s*(?:worth|of items))/i) { fx["gold"] += $1.to_i }
      t.scan(/(?<![\w(])\+\s*(\d+)\s*gp\b/i) { fx["gold"] += $1.to_i }
      t.scan(/\*\*([^*]*\b(?:money|purse|coins?|pouch|savings|winnings|wages|earnings)\b[^*]*?)\s*\((\d+)\s*gp\)\s*\*\*/i) { fx["gold"] += $2.to_i }
      t = t.gsub(/(?:an?\s+)?(?:extra\s+)?\**\s*\d+\s*gp\**(?!\s*(?:worth|of items))/i, " ") if fx["gold"].positive?
      fx["hp"] = "1d4" if t.match?(/\+\s*\(?1?d4\)?\s*(?:max(?:imum)?\s+)?HP/i)
      fx["bonds"] = 1 if t.match?(/second time on the \**\s*bonds/i)
      fx["omen"] = true if t.match?(/roll on the \**\s*omens/i)
      if (m = t.match(/(\d+)\s*gp\s*worth of items|from the \[?(?:gear|marketplace)/i))
        fx["marketplace"] = m[1] ? "#{m[1]}gp of gear" : "gear"
      end
      # items: bold names, or "take/start with/carry a thing (tags)"; a cell's leading **Label**. is its heading
      t2 = t.sub(/\A\s*\*\*[^*]+\*\*\s*[.:]/, "")
      seen = []
      add = lambda do |name, tag_text|
        name = plain(name).strip.gsub(/\A[ ,.;:']+|[ ,.;:']+\z/, "").sub(/\A(?:a|an|the|some|your|one|two|three)\s+/i, "")
        return if name.empty? || NOT_ITEMS.include?(name.downcase) || name.size > 40 || seen.map(&:downcase).include?(name.downcase)
        seen << name
        fx["items"] << item(name, tags_of(tag_text || ""))
      end
      t2.scan(/\*\*([^*]+)\*\*(\s*\(([^()]*)\))?/) { add.call($1, $3) }
      t2.scan(/\b(?:take|start with|carry)\s+((?:an?|the|some)\s+)?([a-z][\w' -]{1,40}?)\s*\(([^()]*)\)/i) { add.call($2, $3) }
      fx
    end

    # a section as HTML, its tables wrapped as Just the Docs wraps the page's own (so a wide one scrolls in its frame)
    def markdown(md)
      html = @site.find_converter_instance(Jekyll::Converters::Markdown).convert(md)
      html.gsub("<table", '<div class="table-wrapper"><table').gsub("</table>", "</table></div>")
    end

    # background n, from its row in Character Creation's table
    def background(n, row)
      m = row.match(%r{\[([^\]]+)\]\(/second-edition/backgrounds/([\w-]+)/?\)}) or raise Shape, "background #{n}'s row has no link"
      name = m[1]
      slug = m[2]
      rel = "second-edition/backgrounds/#{slug}.md"
      text = body(rel)
      quote = text.lines.select { |l| l.strip.start_with?(">") }.map { |l| l.chomp.sub(/\A\s*>\s?/, "") }.join(" ").strip
      names = section_lines(text, "Names").join(" ").split(",").map(&:strip).reject(&:empty?)
      gear = []
      section_lines(text, "Starting Gear").each do |l|
        if l.match?(/\A\s*[-*] /)
          gear << l.sub(/\A\s*[-*] /, "").strip
        elsif !l.strip.empty? && !gear.empty?
          gear[-1] += " #{l.strip}"  # a line that runs on
        end
      end
      items = gear.reject { |g| g.match?(/\A\s*\d+d\d+\s+gold/i) }.map do |g|
        nm = plain(g.split(/\s*\(/, 2)[0])
        it = item(nm, {"full" => plain(g)}.merge(tags_of(g.scan(TAG).flatten.join(" "))))
        it["from_table"] = true if g.include?("(see table)")
        it.merge(@fixes["#{slug}/gear/#{nm}"] || {})
      end
      tables = []
      sections = []
      text.scan(/^## (.+?)\s*$/).flatten.each do |h|
        lines = section_lines(text, h)
        sections << {"title" => plain(h), "html" => markdown(lines.join("\n"))}
        next if %w[Names Starting\ Gear].include?(h)
        tl = lines.select { |l| l.strip.start_with?("|") }
        next if tl.empty?
        columns, rows = md_table(tl)
        rows = rows.select { |r| number(r[0]) }
        kind = columns.size > 1 ? columns[1].downcase : "result"
        parsed = rows.map do |r|
          cells = r[1..].map(&:strip)
          fx = effects(cells.join(" "))
          if kind == "item" && slug != "rill-runner"  # the Item column names the item; its description carries the tags
            lead = plain(cells[0])
            tg = cells.size > 1 ? cells[1].scan(TAG).flatten.join(" ") : ""
            fx["items"] = [item(lead, tags_of(tg))] + fx["items"].reject { |i| i["name"].downcase == lead.downcase }
          elsif %w[mount specialty item].include?(kind)  # a horse, a specialty or a talent: notes, not slots
            fx["items"] = fx["items"].reject { |i| i["name"].downcase == plain(cells[0]).downcase }
          end
          {"n" => number(r[0]), "cells" => cells, "text" => plain(cells.join(" — ")), "fx" => fx}
        end
        tables << {"title" => plain(h), "kind" => kind, "rows" => parsed}
      end
      unless names.size == 10 && tables.size == 2 && tables.all? { |t| t["rows"].size == 6 }
        raise Shape, "#{rel} no longer has 10 names and two d6 tables"
      end
      qfx = effects(quote)
      {"n" => n, "id" => slug, "url" => @pages[rel].url, "name" => name, "quote" => quote, "names" => names,
       "items" => items, "tables" => tables, "fx" => qfx.slice("bonds", "omen"), "sections" => sections}
    end

    def builder_data
      cc = body(CC)
      order = pairs(table_lines(cc, "Backgrounds"))
      raise Shape, "the Backgrounds table no longer has 20 rows" unless order.keys.sort == (1..20).to_a
      out = {"backgrounds" => (1..20).map { |n| background(n, order[n]) }, "traits" => [], "bonds" => [], "omens" => []}
      TRAITS.each do |t|
        d = pairs(table_lines(cc, t, 3))
        raise Shape, "the #{t} table no longer has 10 entries" unless d.keys.sort == (1..10).to_a
        out["traits"] << {"name" => t, "values" => (1..10).map { |i| plain(d[i]) }}
      end
      [%w[bonds Bonds], %w[omens Omens]].each do |key, title|
        d = pairs(table_lines(cc, title))
        raise Shape, "the #{title} table no longer has 20 rows" unless d.keys.sort == (1..20).to_a
        out[key] = (1..20).map { |i| {"n" => i, "text" => plain(d[i]), "fx" => key == "bonds" ? effects(d[i]) : {}} }
      end
      apply_fixes(out)
      out
    end

    # the corrections in _data/cairn_builder_fixes.yml, keyed background/table/row, bond/N or quote/background
    def apply_fixes(out)
      @fixes.each do |key, fix|
        parts = key.split("/")
        next if parts.size == 3 && parts[1] == "gear"  # applied to the starting gear above
        target = case parts[0]
                 when "bond" then out["bonds"][parts[1].to_i - 1]&.dig("fx")
                 when "quote" then out["backgrounds"].find { |b| b["id"] == parts[1] }&.dig("fx")
                 else out["backgrounds"].find { |b| b["id"] == parts[0] }&.dig("tables", parts[1].to_i, "rows", parts[2].to_i - 1, "fx")
                 end
        next Jekyll.logger.warn("cairn_builder:", "the fix #{key} matches nothing; skipped") unless target
        target.merge!(fix)
      end
    end
  end
end
