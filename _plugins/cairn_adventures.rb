# frozen_string_literal: true

require_relative "cairn_text"
require_relative "cairn_covers"

require "uri"
require "yaml"
require "date"

# The Adventures catalog, built at deploy time: every adventure in this repo's adventures/ pages and in Scrivener
# (yochaigal/scrivener, Yochai's card catalog), one entry each, matched by name, into site.data["cairn_adventures"].
#
# Scrivener is checked out into _scrivener/ by the deploy workflow (.github/workflows/jekyll.yml). Without it the
# catalog lists this repo's pages only, with a warning; the build never fails over it. A match takes Scrivener's
# cover, summary, price and tags, and this repo's page. An entry opens its page here when it has one (a module or a
# conversion), and otherwise its store page (itch.io, the Cairn store).
module Cairn
  class Adventures < Jekyll::Generator
    include Text
    safe true
    priority :low

    GROUPS = {"first-party" => "First Party", "originals" => "Originals", "conversions" => "Conversions"}.freeze

    def generate(site)
      posts = scrivener_posts(File.join(site.source, "_scrivener", "posts"))
      repo = repo_adventures(site)
      site.data["cairn_adventures"] = merge(posts, repo)
      Covers.copy(site, site.data["cairn_adventures"])
      site.data["cairn_adventure_groups"] = GROUPS.map do |k, label|
        {"id" => k, "label" => label, "count" => site.data["cairn_adventures"].count { |e| e["group"] == k }}
      end
    end

    private

    def log(msg) = Jekyll.logger.info("cairn_adventures:", msg)
    def warn(msg) = Jekyll.logger.warn("cairn_adventures:", msg)

    def norm_name(s)
      s = plain(s).downcase.gsub("&", "and")
      s = s.sub(/\Acas-\d+:\s*/, "")
      s = s.gsub(/\((?:cairn|2e)[^)]*\)|\bfor cairn\b|\bcairn edition\b/, "")
      s.gsub(/[^a-z0-9]+/, "")
    end

    def present(v) = v.to_s.empty? ? nil : v

    def as_list(v) = v.is_a?(Array) ? v : (v.nil? || v == "" ? [] : [v])

    # A post's front matter, read as YAML. Front matter with no closing --- runs to the end of the file (four Scrivener
    # posts are like that). Values come back as strings, or lists of strings, as the merge below expects.
    def front_matter(text)
      m = text.match(/\A---\s*\n(.*?)(?:^---\s*$|\z)/m) or return nil
      fm = YAML.safe_load(m[1], permitted_classes: [Date, Time]) || {}
      return nil unless fm.is_a?(Hash)
      fm.transform_values { |v| v.is_a?(Array) ? v.map(&:to_s) : (v.nil? ? nil : v.to_s) }
    end

    def scrivener_posts(dir)
      unless Dir.exist?(dir)
        warn("no Scrivener checkout at _scrivener/; the catalog lists this repo's pages only")
        return []
      end
      Dir.glob(File.join(dir, "**", "*.md")).sort.filter_map do |f|
        fm = begin
          front_matter(File.read(f, encoding: "utf-8"))
        rescue StandardError => e
          warn("#{File.basename(f)} unreadable (#{e.message})")
          nil
        end
        next if fm.nil? || fm["name"].to_s.empty?
        fm if as_list(fm["category"]).include?("adventures")
      end
    end

    # a conversion's credit: the first line that links out, as [author, url, the line in plain text]
    def credit(body)
      line = body.lines.find { |l| l.match?(/\]\(https?:\/\//) } || ""
      url = line[/\]\((https?:\/\/[^)\s]+)\)/, 1]
      text = plain(line.sub(/\A\s*-\s*/, "")).gsub(/\s+/, " ")
      author = nil
      if (by = text.match(/\bby\s+(.+)/))
        # a name ends at a full stop (not an initial's, as in Gus L./Ratking), a comma, or where the sentence moves on
        author = by[1].split(/(?<![\s\/][A-Z])\.(?:\s|\z)|[,!]|\s+(?:by|and published|written for|for|in|Updated|Posted)\s/).first.to_s.strip
        author = author.sub(/(?<=[a-z]{2})\.\z/, "")
      end
      [present(author), url, text]
    end

    def repo_adventures(site)
      GROUPS.keys.flat_map do |g|
        site.pages.select { |p| p.path.start_with?("adventures/#{g}/") && p.path.end_with?(".md") }.sort_by(&:path).map do |p|
          redirect = p.data["redirect_to"]
          e = {"name" => plain(p.data["title"] || File.basename(p.path, ".md")), "group" => g,
               "page" => redirect ? nil : p.url, "url" => redirect.is_a?(Array) ? redirect.first : redirect}
          if g == "conversions"
            e["author"], e["url"], e["credit"] = credit(p.content)
          elsif e["page"]  # a module Scrivener doesn't list yet: its byline and cover from the page itself
            e["author"] = p.content[/^An adventure module for .*? by (.+?)\s*$/i, 1]
            e["cover"] = p.content[/!\[[^\]]*\]\(([^)\s]+)\)/, 1]
          end
          e
        end
      end
    end

    def summary_paras(s)
      out = []
      s.to_s.split("\n\n").each { |p| p = p.split.join(" "); out << p unless p.empty? || out.include?(p) }
      out
    end

    def merge(posts, repo)
      by_norm = Hash.new { |h, k| h[k] = [] }
      repo.each { |e| by_norm[norm_name(e["name"])] << e }
      out = []
      matched = 0
      posts.each do |p|
        r = by_norm[norm_name(p["name"])].shift
        matched += 1 if r
        tags = as_list(p["tags"]) - ["first-party"]
        as_list(p["genre"]).each { |g| tags << g.downcase unless tags.include?(g.downcase) }
        group = as_list(p["tags"]).include?("first-party") ? "first-party" : (r ? r["group"] : "originals")
        out << {"name" => plain(p["name"]), "group" => group, "author" => present(p["author"]) || r&.dig("author"),
                "url" => present(p["source-url"]) || r&.dig("url"), "cover" => present(p["cover-image"]),
                "summary" => summary_paras(p["summary"]), "cost" => present(p["cost"]), "tags" => tags, "page" => r&.dig("page")}
      end
      have = out.map { |e| norm_name(e["name"]) }
      by_norm.values.flatten.each do |e|
        next log("#{e['name']} is also listed under #{GROUPS[e['group']]}; shown once") if have.include?(norm_name(e["name"]))
        out << {"name" => e["name"], "group" => e["group"], "author" => e["author"], "url" => e["url"], "cover" => e["cover"],
                "summary" => e["credit"] ? [e["credit"]] : [], "cost" => nil, "tags" => [], "page" => e["page"]}
      end
      out.sort_by! { |e| [e["name"].downcase, e["group"]] }
      out.each { |e| priced(e); link(e) }
      log("#{posts.size} Scrivener entries, #{matched} matched a page here; " +
          GROUPS.keys.map { |g| "#{out.count { |e| e['group'] == g }} #{g}" }.join(", "))
      out
    end

    # "Free" is free, any other listed price is paid (sorted by its amount), no price is "not listed"
    def priced(e)
      cost = e["cost"].to_s.strip
      free = cost.match?(/\Afree\z/i)
      e["price_kind"] = free ? "free" : (cost.empty? ? "unknown" : "paid")
      e["price"] = free ? 0 : (cost.match?(/\d/) ? cost.gsub(/[^\d.]/, "").to_f : nil)
    end

    # where a card goes: its page here, or its store; and, for a store, the store's name ("On itch.io")
    def link(e)
      e["href"] = e["page"] || (e["url"].to_s.match?(/\Ahttps?:/) ? e["url"] : nil)
      return if e["page"] || e["href"].nil?
      host = (URI.parse(e["href"]).host.to_s.sub(/\Awww\./, "") rescue "")
      store = host.match?(/(\A|\.)itch\.io\z/) ? "itch.io" : host.match?(/(\A|\.)cairnrpg\.com\z/) ? "the Cairn store" : host
      e["out"] = (store == "itch.io" ? "On " : "At ") + store unless store.empty?
    end
  end
end
