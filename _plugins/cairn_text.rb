# frozen_string_literal: true

# Text helpers shared by the Cairn generators in _plugins/.
module Cairn
  module Text
    module_function

    # Markdown with links, emphasis and escapes taken out
    def plain(s)
      s.to_s.gsub(/!?\[([^\]]*)\]\([^)]+\)/, '\1').gsub(/[*_]/, "").gsub(/\\(.)/, '\1').strip
    end
  end
end
