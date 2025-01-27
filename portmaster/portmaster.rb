# frozen_string_literal: true

require 'json'

begin
  data = JSON.parse(File.read('ports.json'), symbolize_names: true)
  items = data.select { |item| item[:rtr] == false }
  puts items.to_json
rescue Errno::ENOENT
  error = { error: 'File not found' }
  puts JSON.generate(error)
rescue JSON::ParserError
  error = { error: 'Invalid JSON format' }
  puts JSON.generate(error)
rescue StandardError => e
  error = { error: e.message }
  puts JSON.generate(error)
end
