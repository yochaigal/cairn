# frozen_string_literal: true

require_relative "cairn_text"

require "json"

# The character builder's Export for Kettlewright: a file Kettlewright's New from JSON page imports
# (yochaigal/kettlewright, app/main.py). The gear, containers and pets in it are Kettlewright's own for the rolled
# background, rows and bonds, so an import matches what Kettlewright's generator would make. This sets them on the
# builder's records as "kw", and the pet templates they name as "kw_pets".
#
# Kettlewright's background, bond and pet data are checked out into _kettlewright/ by the deploy workflow
# (.github/workflows/jekyll.yml). Without them, or if their rows no longer match the book's, the build logs a
# warning and the review has no export button; the build never fails over it.
module Cairn
  class Kettlewright < Jekyll::Generator
    include Text
    safe true
    priority :lowest  # after Cairn::Builder

    JSON_DIR = File.join("_kettlewright", "app", "static", "json")
    # share of a Kettlewright row's words found in the book's row: a right row scores 0.86 or more, a wrong one 0.70 at most
    MATCH = 0.8

    def generate(site)
      builder = site.data["cairn_builder"] or return
      @dir = File.join(site.source, JSON_DIR)
      return warn("no Kettlewright checkout at _kettlewright/; the builder has no Export for Kettlewright") unless File.directory?(File.join(@dir, "backgrounds"))
      attach(builder)
    rescue StandardError => e  # a row that drifted, a file whose shape changed, or one that won't read: only the export is dropped
      warn("#{e.message}; the builder has no Export for Kettlewright")
    end

    private

    def warn(msg) = Jekyll.logger.warn("cairn_kettlewright:", msg)
    def read_json(*path) = JSON.parse(File.read(File.join(@dir, *path), encoding: "UTF-8"))
    def words(s) = plain(s).downcase.gsub(/[^a-z0-9]+/, " ").split.uniq
    def norm(s) = s.downcase.gsub(/[\s-]+/, " ")

    def check(where, ours, theirs)
      w = words(theirs)
      raise "Kettlewright's #{where} no longer matches the book" if (w & words(ours)).size < MATCH * w.size
    end

    # works out every record's kw first and sets them only at the end, so a failure leaves the builder as it was
    def attach(builder)
      kw = Dir.glob("*.json", base: File.join(@dir, "backgrounds")).sort.map { |f| read_json("backgrounds", f) }.reduce({}, :merge)
      raise "Kettlewright has #{kw.size} backgrounds, the book #{builder["backgrounds"].size}" if kw.size != builder["backgrounds"].size
      by_name = kw.keys.to_h { |k| [norm(k), k] }
      sets = []  # [record, its kw]
      builder["backgrounds"].each do |b|
        key = by_name[norm(b["name"])] or raise "Kettlewright has no background #{b["name"]}"
        tables = [kw[key].fetch("table1"), kw[key].fetch("table2")]
        b["tables"].zip(tables).each_with_index do |(ours, theirs), t|
          opts = theirs.fetch("options")
          raise "Kettlewright's #{key} table #{t + 1} has #{opts.size} rows" if opts.size != ours["rows"].size
          ours["rows"].zip(opts).each do |r, o|
            check("#{key} table #{t + 1} row #{r["n"]}", r["text"], o.fetch("description"))
            sets << [r, {"answer" => o["description"], "items" => o["items"] || [], "containers" => o["containers"] || [], "pets" => o["pets"] || []}]
          end
        end
        sets << [b, {"key" => key, "gear" => kw[key].fetch("starting_gear"), "containers" => kw[key]["starting_containers"] || [],
                     "questions" => tables.map { |t| t.fetch("question") }}]
      end
      bonds = read_json("bonds.json").fetch("Bonds")
      raise "Kettlewright has #{bonds.size} bonds, the book #{builder["bonds"].size}" if bonds.size != builder["bonds"].size
      builder["bonds"].zip(bonds).each do |r, o|
        check("bond #{r["n"]}", r["text"], o.fetch("description"))
        sets << [r, o["items"] || []]
      end
      used = sets.flat_map { |_, k| k.is_a?(Hash) ? k["pets"] || [] : [] }.uniq.sort
      pets = read_json("pets.json")
      missing = used - pets.keys
      raise "Kettlewright's rows name pets it has no template for (#{missing.join(", ")})" unless missing.empty?
      sets.each { |record, k| record["kw"] = k }
      builder["kw_pets"] = pets.slice(*used)
    end
  end
end
