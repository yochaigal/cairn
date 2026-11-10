# frozen_string_literal: true

require "digest"
require "fileutils"
require "open-uri"

module Cairn
  # Copies of the adventures' covers, served from this site, for the Adventures page's prophecy: its book is drawn in
  # WebGL (assets/js/prophecy/book.js), which can only use images from this site or from hosts that allow it, and most
  # covers are hotlinked from itch.io, which doesn't. Each entry with a cover gets "cover_local", its copy here.
  #
  # Remote covers are downloaded once into .jekyll-cache/cairn-covers, which the deploy workflow keeps between runs.
  # This runs for production builds, or with CAIRN_COVERS=1.
  module Covers
    TAG = "cairn_adventures:"
    DIR = "assets/covers"
    CACHE = ".jekyll-cache/cairn-covers"
    TYPES = {"image/jpeg" => "jpg", "image/png" => "png", "image/gif" => "gif", "image/webp" => "webp"}.freeze
    MAX = 3 * 1024 * 1024
    THREADS = 8
    TooBig = Class.new(StandardError)

    module_function

    def copy(site, entries)
      entries.each { |e| e["cover_local"] = e["cover"] if e["cover"].to_s.start_with?("/") }
      return unless ENV["JEKYLL_ENV"] == "production" || ENV["CAIRN_COVERS"] == "1"

      base = File.join(site.source, CACHE)
      dir = File.join(base, DIR)
      FileUtils.mkdir_p(dir)
      remote = entries.select { |e| e["cover"].to_s.match?(/\Ahttps?:/) }
      queue = Queue.new
      remote.map { |e| e["cover"] }.uniq.each { |u| queue << u }
      results = Array.new(THREADS) do
        Thread.new do
          done = []
          while (url = (queue.pop(true) rescue nil))
            done << [url, *fetch(dir, url)]
          end
          done
        end
      end.flat_map(&:value)

      found = results.to_h { |url, name, _| [url, name] }
      remote.each { |e| (name = found[e["cover"]]) && e["cover_local"] = "/#{DIR}/#{name}" }
      found.values.compact.each { |name| site.static_files << Jekyll::StaticFile.new(site, base, DIR, name) }
      counts = results.map(&:last).tally.tap { |c| c.default = 0 }
      Jekyll.logger.info(TAG, "#{counts[:copied]} covers copied, #{counts[:cached]} cached, #{counts[:failed]} failed")
    end

    # [file name, :cached | :copied | :failed]
    def fetch(dir, url)
      key = Digest::SHA1.hexdigest(url)
      hit = Dir.glob(File.join(dir, "#{key}.*")).first
      return [File.basename(hit), :cached] if hit

      body, ext = get(url)
      unless ext
        Jekyll.logger.warn(TAG, "cover not copied (#{body}): #{url}")
        return [nil, :failed]
      end
      name = "#{key}.#{ext}"
      File.binwrite(File.join(dir, name), body)
      [name, :copied]
    end

    # [body, ext], or [why it failed, nil]
    def get(url)
      too_big = ->(n) { raise TooBig if n && n > MAX }
      URI.parse(url).open("User-Agent" => "cairnrpg.com site build", open_timeout: 10, read_timeout: 10,
                          content_length_proc: too_big, progress_proc: too_big) do |io|
        ext = TYPES[io.content_type]
        ext ? [io.read, ext] : ["not an image: #{io.content_type}", nil]
      end
    rescue TooBig
      ["over #{MAX / 1024 / 1024} MB", nil]
    rescue StandardError => e
      [e.class.name, nil]
    end
  end
end
