# frozen_string_literal: true

# jekyll-dice-tray reparses each page as an HTML fragment, which drops <!DOCTYPE> (so browsers use quirks mode) and
# <html lang> (WCAG 3.1.1). This puts both back, after that plugin's hook; browsers infer the head and body.
Jekyll::Hooks.register(%i[pages documents], :post_render, priority: :low) do |doc|
  next unless doc.output_ext == ".html"
  out = doc.output.to_s
  next if out.lstrip.start_with?("<!DOCTYPE", "<!doctype")
  doc.output = %(<!DOCTYPE html>\n<html lang="#{doc.site.config['lang'] || 'en-US'}">\n#{out})
end
