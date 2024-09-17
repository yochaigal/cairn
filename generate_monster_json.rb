#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require 'redcarpet'

# Value object for each monster in the list
class Monster
  def initialize(markdown)
    @markdown = markdown
  end

  attr_reader :markdown

  # Search for the first line that matches the header pattern (#)
  def name
    header_line = markdown.find { |line| line.match(/^#\s*(.*)/) }
    header_line&.match(/^#\s*(.*)/)&.send(:[], 1)&.strip
  end

  # Extracts the stats like HP, STR, DEX, WIL, armor, and all attacks from the markdown
  def stats
    stats_line = markdown.find { |line| line.match(/\d+ HP/) }
    return {} unless stats_line

    # Extract HP, Armor, STR, DEX, WIL
    hp = stats_line.match(/(\d+)\s*HP/)&.send(:[], 1)
    armor = stats_line.match(/(\d+)\s*Armor/)&.send(:[], 1) # Capture the Armor value if present
    str = stats_line.match(/(\d+)\s*STR/)&.send(:[], 1)
    dex = stats_line.match(/(\d+)\s*DEX/)&.send(:[], 1)
    wil = stats_line.match(/(\d+)\s*WIL/)&.send(:[], 1)

    # Extract all attacks (e.g., "ceremonial dagger (d6), club (d10)")
    attacks = stats_line.scan(/([a-zA-Z\s]+)\s*\((.*?)\)/).map do |attack, damage|
      { name: attack.strip, damage: damage }
    end

    { hp: hp, armor: armor, str: str, dex: dex, wil: wil, attacks: attacks }
  end

  def description
    renderer = Redcarpet::Render::HTML.new
    redcarpet = Redcarpet::Markdown.new(renderer)
    # The description starts after the metadata and the header
    redcarpet.render(markdown.drop_while { |line| !line.match(/^#/) }.drop(1).join)
  end
end

# Process all markdown files in the "monsters" folder
monsters = Dir.glob('monsters/*.md').map do |monster_file|
  markdown = File.readlines(monster_file)
  monster = Monster.new(markdown)

  {
    name: monster.name,
    description: monster.description,
    stats: monster.stats
  }
end.to_json

# Output the JSON
puts JSON.pretty_generate(JSON.parse(monsters))

