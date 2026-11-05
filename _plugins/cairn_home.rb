# frozen_string_literal: true

# The home page's text and counts, read from the site's own Markdown at build time, so they follow the pages:
#   site.data["cairn_home"]["hero"]   the first two sentences of README.md's first paragraph
#   site.data["cairn_home"]["share"]  the first sentence of its second and third paragraphs
#   site.data["cairn_home"]["steps"]  the three "Start playing" pages, with the H2 headings each one covers
#   site.data["cairn_home"]["counts"] how many monsters, backgrounds, hacks and First Edition pages there are
# If a page moves or loses its text, that piece is left out and the build logs a warning; it never fails.
module Cairn
  class HomeData < Jekyll::Generator
    safe true
    priority :low

    STEPS = %w[
      second-edition/players-guide/overview-and-principles.md
      second-edition/players-guide/character-creation.md
      second-edition/players-guide/core-rules.md
    ].freeze

    def generate(site)
      by_path = site.pages.to_h { |p| [p.path, p] }
      readme = by_path["README.md"]
      paras = readme ? paragraphs(readme.content) : []
      warn("README.md has fewer than three paragraphs") if paras.size < 3

      steps = STEPS.filter_map do |rel|
        page = by_path[rel]
        next warn("#{rel} is missing") unless page
        {"url" => page.url, "title" => page.data["title"], "covers" => h2s(page.content)}
      end

      site.data["cairn_home"] = {
        "hero" => paras[0] && sentences(paras[0], 2),
        "share" => [paras[1], paras[2]].compact.map { |p| sentences(p, 1) },
        "steps" => steps,
        "counts" => {
          "monsters" => children(site, "Monsters"),
          "backgrounds" => children(site, "Backgrounds"),
          "hacks" => children(site, "Hacks"),
          "first_edition" => children(site, "First Edition"),
        },
      }
    end

    private

    def warn(msg)
      Jekyll.logger.warn("cairn_home:", msg)
      nil
    end

    def children(site, parent)
      site.pages.count { |p| p.data["parent"] == parent }
    end

    # Markdown with links, emphasis and escapes taken out
    def plain(s)
      s.gsub(/!?\[([^\]]*)\]\([^)]+\)/, '\1').gsub(/[*_]/, "").gsub(/\\(.)/, '\1').strip
    end

    # prose paragraphs, skipping headings, lists, tables, quotes and HTML
    def paragraphs(md)
      out = []
      cur = []
      md.each_line do |line|
        t = line.strip
        if t.empty? || t.start_with?("#", "-", "*", "|", "<", ">")
          out << cur.join(" ") unless cur.empty?
          cur = []
        else
          cur << t
        end
      end
      out << cur.join(" ") unless cur.empty?
      out.map { |p| plain(p) }
    end

    # a sentence ends at . ! or ? followed by a space or the end, so "4.0" stays whole
    def sentences(text, n)
      text.gsub(/\s+/, " ").strip.scan(/.+?[.!?](?=\s|\z)/).first(n).map(&:strip).join(" ")
    end

    def h2s(md)
      md.scan(/^## (.+?)\s*$/).flatten.map { |h| plain(h) }.uniq
    end
  end
end
