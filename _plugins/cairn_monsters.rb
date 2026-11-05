# frozen_string_literal: true

# The Monsters index (resources/monsters.md): every monster page under resources/monsters/, read at build time into
# site.data["cairn_monsters"], sorted by name. Each has its name, URL, stats as [label, number] pairs in the page's
# own order ("6 HP, 12 STR, 14 DEX, 8 WIL, bite (d8)"), the attack after them, and its bullet points (Markdown).
# A page whose stat line doesn't read that way is still listed, with its first line as the attack, and the build
# logs a warning; it never fails.
module Cairn
  class Monsters < Jekyll::Generator
    safe true
    priority :low

    STAT = /\A((?:\s*\d+\s+(?:HP|Armor|STR|DEX|WIL)\s*(?:,|\z))+)\s*(.*)\z/.freeze

    def generate(site)
      pages = site.pages.select { |p| p.path.start_with?("resources/monsters/") && p.data["parent"] == "Monsters" }
      site.data["cairn_monsters"] = pages.filter_map { |p| monster(p) }.sort_by { |m| m["name"].downcase }
    end

    private

    def monster(page)
      body = page.content
      h = body.match(/^# (.+)$/)
      name = h ? h[1].strip : page.data["title"]
      unless name
        Jekyll.logger.warn("cairn_monsters:", "#{page.path} has no heading; left out")
        return nil
      end
      rest = (h ? body[h.end(0)..] : body).strip.lines
      line = rest.map(&:strip).find { |l| !l.empty? && !l.start_with?("-") } || ""
      bullets = rest.select { |l| l.lstrip.start_with?("- ") }.map { |l| l.sub(/\A\s*- /, "").strip }
      m = line.match(STAT)
      if m
        stats = m[1].scan(/(\d+)\s+(HP|Armor|STR|DEX|WIL)/).map { |v, k| [k, v] }
        attack = m[2].strip
      else
        Jekyll.logger.warn("cairn_monsters:", "#{page.path}: unexpected stat line #{line.inspect}")
        stats = []
        attack = line
      end
      attack = attack[0].upcase + attack[1..] unless attack.empty?
      {"name" => name, "url" => page.url, "stats" => stats, "attack" => attack, "bullets" => bullets}
    end
  end
end
