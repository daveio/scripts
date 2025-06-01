# Myriad

Welcome to "Myriad" — because apparently naming repositories after what they actually do is just too mainstream. This is my glorious dumping ground of miscellaneous utilities, scripts, and guides that I've cobbled together over the years. Think of it as that drawer in your kitchen filled with random useful stuff that you can never find when you actually need it.

## Overview

"Myriad" (yes, I'm quite proud of that name, thank you very much) contains a hodgepodge of tools organized by language or technology — because some semblance of order is better than none:

- **Python**: Scripts for when I got tired of managing image metadata and organizing music by hand (life's too short, right?)
- **Shell**: Fish shell scripts for various system administration tasks (because clicking buttons is so 2010)
- **Mixed**: Guides and configurations that refuse to fit neatly into a single category (just like my career path)

## Repository Structure

### Python

#### musicbrainz-picard

Utilities for MusicBrainz Picard, because apparently I have opinions about how my music should be tagged. Very strong opinions.

#### orphaned-xmp

Tools for hunting down those pesky orphaned XMP metadata files that multiply like digital rabbits when you're not looking.

#### xmp-mover

Utilities for wrangling XMP sidecar files into submission. Photography workflows are fun, said no one ever who's had to manage thousands of these files.

### Shell

#### asdf-latest.fish

A Fish shell script for the [asdf version manager](https://asdf-vm.com/), because keeping track of language versions manually is a special kind of torture I reserve for my enemies.

#### mastodon-maintenance.fish

Maintenance scripts for Mastodon instances. Because running your own social media server wasn't complicated enough already.

#### sixkcd.fish

A Fish shell script for XKCD comics. Because sometimes you just need a nerdy comic in your terminal to remind you why you became a developer.

### Mixed

#### netflow

A comprehensive guide to setting up network flow monitoring using ntopng with netflow2ng in Docker and Mikrotik RouterOS 7. Includes:

- Docker environment setup (containers, containers everywhere!)
- Mikrotik RouterOS configuration (yes, the CLI is from 1995, and no, they won't change it)
- System maintenance (or: "how to keep this Rube Goldberg machine running")
- Advanced configuration options (for when the basic setup isn't quite complicated enough)
- Troubleshooting tips (because it WILL break, trust me)

## Usage

Each directory contains specific utilities with their own usage instructions. For detailed information about a particular tool, check the README in its directory. Yes, that means more reading. I'm sorry.

## Development

The repository uses several code quality tools because I like to pretend my haphazard collection of scripts is actually professional-grade software:

- [Ruff](https://github.com/charliermarsh/ruff) for Python linting (it's faster than Black, fight me)
- [Sourcery](https://sourcery.ai/) for code quality suggestions (because having an AI tell me my code is bad is somehow less painful)
- [Trunk](https://trunk.io/) for developer tooling (it's like having a responsible adult watching over your shoulder)

## License

Please check individual directories for specific licensing information. Unless otherwise specified, the code is available for personal use but may not include explicit licensing terms. Basically, it's "look but don't sue" licensing.

## Contributing

This is primarily my personal junk drawer of tools, but if you feel compelled to contribute to this magnificent chaos, be my guest. Open an issue or submit a pull request. Just don't expect a swift response — I'm probably off writing yet another utility that I'll add here and then forget about.
