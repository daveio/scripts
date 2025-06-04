# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = 'envhunter'
  spec.version       = '1.0.0'
  spec.authors       = ['Dave Williams']
  spec.email         = ['dave@dave.io']
  spec.summary       = 'CLI tool to hunt for secrets in GitHub .env files'
  spec.description   = 'Search GitHub code or gists for .env files containing high-entropy secrets like tokens and keys.'
  spec.homepage      = 'https://github.com/daveio/envhunter'
  spec.license       = 'MIT'

  spec.files         = Dir['lib/**/*.rb'] + ['bin/envhunter', 'README.md']
  spec.executables   = ['envhunter']
  spec.require_paths = ['lib']

  spec.add_runtime_dependency 'commander'
  spec.add_runtime_dependency 'csv'
  spec.add_runtime_dependency 'httparty'
  spec.add_runtime_dependency 'json'
  spec.add_runtime_dependency 'yaml'
end
