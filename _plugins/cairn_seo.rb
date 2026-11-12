# frozen_string_literal: true

require_relative "cairn_text"

# What search results and link previews say about a page. jekyll-seo-tag writes the tags (in the theme's head) from
# each page's `description:`; no page here sets one, so this fills it in before the pages render:
#   a page with a `summary:` uses it; any other page uses the opening of its own text, or its section headings, up
#   to about 160 characters.
# The words are always the page's own. The home page, and a page with no text of its own, get none here: they would
# take the site's `description:` in _config.yml, which is not set.
module Cairn
  class Seo < Jekyll::Generator
    include Text
    safe true
    priority :low

    MAX = 160

    def generate(site)
      site.pages.each do |page|
        next if page.data["description"] || page.data["redirect_to"] || page.url == "/"
        next unless page.html? && page.data["layout"]

        text = page.data["summary"] || opening(page)
        page.data["description"] = text if text
      end
    end

    private

    # the page's introduction (its text before the first H2) when that has a prose paragraph or quote that reads as a
    # sentence; or else, for a page in sections, its title and their headings ("Core Rules: Attributes, Saves, ...");
    # or else (a stat block, a page of lists) its first lines run together
    def opening(page)
      md = page.content.to_s.gsub(/<!--.*?-->|<(script|style)\b.*?<\/\1>|<[^>]*>/m, "").gsub(/^```.*?^```/m, "")
      intro, rest = md.split(/^## /, 2)
      lead = blocks(intro).find { |kind, text| kind != :item && text.size >= 60 && !text.end_with?(":") }
      h2s = rest ? "## #{rest}".scan(/^## (.+?)\s*$/).flatten.map { |h| clean(h) }.uniq : []
      title = page.data["title"] || md[/^# (.+?)\s*$/, 1]
      list = "#{clean(title)}: #{h2s.join(', ')}" if h2s.size >= 2 && title
      # a page of two or three sections says more in its first sentence than in their names ("Introduction, Example")
      lead ||= blocks(md).find { |kind, text| kind != :item && text.size >= 60 && !text.end_with?(":") } if list && list.size < 60
      text = lead ? lead[1] : list || run(blocks(md))
      text.size < 25 ? nil : clip(text)
    end

    # [kind, text] for each paragraph, list item and quote, in order; headings, tables, Liquid tags, images and
    # callout markers are left out
    def blocks(md)
      out = []
      cur = nil
      push = lambda do
        text = cur && clean(cur[1].join(" "))
        out << [cur[0], text] if text && !text.empty?
        cur = nil
      end
      md.to_s.each_line do |line|
        t = line.strip
        kind = if t.empty? || t.start_with?("#", "|", "{%", "{:", "![", "---") then nil
               elsif t =~ /\A(?:[-*+]|\d+\.)\s+/ then :item
               elsif t.start_with?(">") then :quote
               else :para
               end
        t = t.sub(/\A(?:[-*+]|\d+\.)\s+/, "").sub(/\A(?:>\s*)+/, "") if kind
        if kind.nil? || t.empty? || t.start_with?("[!")
          push.call
        elsif cur && kind == cur[0] && kind != :item
          cur[1] << t
        else
          push.call
          cur = [kind, [t]]
        end
      end
      push.call
      out
    end

    def clean(s)
      plain(s.gsub(/!\[[^\]]*\]\([^)]*\)/, "").gsub(/\{\{.*?\}\}|`/, "")).gsub(/\s+/, " ").strip
    end

    # the blocks as one line: list items in a row are a comma list, anything else a sentence each
    def run(blocks)
      out = +""
      prev = nil
      blocks.each do |kind, text|
        break if out.size >= MAX

        unless out.empty?
          out << (out.match?(/[.!?:;,]\z/) ? " " : prev == :item && kind == :item ? ", " : ". ")
        end
        out << text
        prev = kind
      end
      out
    end

    # whole sentences when they fit, or else whole words and an ellipsis
    def clip(text)
      return text if text.size <= MAX

      cut = text[0, MAX + 1]
      stop = cut.rindex(/[.!?](?=\s)/)
      return cut[0..stop] if stop && stop >= 80

      "#{cut[0, MAX].sub(/\s+\S*\z/, '').sub(/[,;:]\z/, '')}…"
    end
  end
end
