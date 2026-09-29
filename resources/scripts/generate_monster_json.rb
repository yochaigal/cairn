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

  def name
    markdown[4].match(/#\s*(.*)/)&.send(:[], 1)&.strip
  end

  def description
    renderer = Redcarpet::Render::HTML.new
    redcarpet = Redcarpet::Markdown.new(renderer)
    redcarpet.render(markdown[6, (markdown.size - 7)].join)
  end
end

monsters = Dir.glob('monsters/*')

monsters = monsters.map do |monster|
  markdown = File.readlines(monster)
  monster = Monster.new(markdown)
  { name: monster.name, description: monster.description }
end.to_json

puts JSON.pretty_generate(JSON.parse(monsters))
