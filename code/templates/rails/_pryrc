# frozen_string_literal: true

Pry.config.auto_reload = true
Pry.config.color = true
Pry.config.color_scheme = "monokai"
Pry.config.doc = true
Pry.config.doc_string = true
Pry.config.doc_string_on_use = true
Pry.config.doc_string_on_use_only_with_pry = true
Pry.config.editor = "zed -w"
Pry.config.history_file = "tmp/pry_history.rb"
Pry.config.history_file_append = true
Pry.config.history_file_max_size = 1000
Pry.config.history_size = 1000
Pry.config.reload_modules = true
Pry.config.reload_modules_only_with_pry = true
Pry.config.theme = "monokai"

Pry.config.prompt = Pry::Prompt.new(
  :custom,
  "custom prompt with timestamp and Rails env",
  [
    proc { |_context, _nesting, pry_instance|
      env = defined?(Rails) ? "[#{Rails.env}] " : ""
      "#{Time.zone.now.to_s[0..-6]}#{env}#{pry_instance.config.prompt_name} > "
    }
  ]
)
