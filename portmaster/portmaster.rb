# frozen_string_literal: true

require 'json'

begin
  data = JSON.parse(File.read('ports.json'), symbolize_names: true)[:ports].to_a.map { |item| item[1] }
  ready_to_run = data.filter { |item| item[:attr][:rtr] }
  runnable = ready_to_run.filter do |item|
    item[:attr][:arch].include?('aarch64') || item[:attr][:arch].include?('armhf')
  end
  runnable.map { |item| item[:source][:url] }.sort.uniq.each { |url| puts url unless url.nil? || url.empty? }
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
