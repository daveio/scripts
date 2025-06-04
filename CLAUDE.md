# Myriad Repository Guide for AI Assistants

This document provides guidance for AI assistants like Claude to effectively understand and work with the "myriad" repository. Use this as a reference when helping users with this codebase.

## Repository Overview

The "myriad" repository is a collection of miscellaneous utilities, scripts, and guides across various programming languages and technologies. It serves as a personal toolkit containing solutions to specific problems. The repository includes:

- Python utilities for handling image metadata and music organization
- Fish shell scripts for system administration and terminal utilities
- Network configuration guides and documentation

This repository follows a modular structure where each utility is self-contained within its directory, making it easier to understand and use independently.

## Repository Structure

### Images Directory (`/images`)

Contains image resources organized into subdirectories:

- **multipurpose**: Generic images that can be used across various projects and contexts.

- **projects**: Project-specific images organized by use case:
  - **social**: Social media graphics divided into JPEG and PNG formats
  - **square**: Square-format images for profile pictures and icons

### Python Directory (`/python`)

Contains Python utilities organized into separate projects:

- **orphaned-xmp**: A utility to find and manage orphaned XMP sidecar files (metadata files used in photography workflows). The tool identifies XMP files that no longer have corresponding media files and provides options to delete or report them.

- **xmp-mover**: A utility to find XMP files with companion files (same base name but different extensions) and move them to a designated directory. Useful for organizing photography assets.

- **musicbrainz-picard**: Utilities related to MusicBrainz Picard, a music tagger and organizer. Contains tools to enhance or extend Picard functionality.

### Shell Directory (`/shell`)

Contains Fish shell scripts for various system tasks:

- **asdf-latest.fish**: A utility for managing the asdf version manager, helping to keep language runtimes up to date.

- **mastodon-maintenance.fish**: Maintenance scripts for Mastodon instances, automating common administration tasks.

- **sixkcd.fish**: A script to display XKCD comics in terminal using sixel graphics. Works with iTerm2 or terminals that support sixel graphics.

### Mixed Directory (`/mixed`)

Contains guides and configurations involving multiple technologies:

- **netflow**: A comprehensive guide for setting up network flow monitoring using ntopng with netflow2ng in Docker and Mikrotik RouterOS 7. Includes Docker configuration, router setup, and troubleshooting information.

### Research Directory (`/research`)

Contains research notes, experiments, and documentation on various topics:

- **catppuccin**: Research on the Catppuccin color scheme and its application across different tools and environments.

- **cloudflare**: Notes and configurations related to Cloudflare services and APIs.

- **dependabot**: Research on GitHub Dependabot configuration and automation.

- **eve-online**: Documentation related to EVE Online gameplay and tools.

- **gnu-find**: Advanced usage patterns and examples for the GNU find command.

- **javascript**: Research on JavaScript patterns, frameworks, and libraries.

- **roadman-dialect**: Linguistic research on the roadman dialect and its characteristics.

- **traffic-analysis**: Network traffic analysis techniques and tools.

### TypeScript Directory (`/typescript`)

Contains TypeScript projects and utilities:

- **bump**: A dependency management tool that updates packages across multiple repositories and programming languages with intelligent version bumping. Features include:
  - Multi-repository and multi-language support (JavaScript/TypeScript, Python, Ruby)
  - Smart version bumping based on semantic versioning rules
  - Git integration for handling repository changes
  - Terminal UI with progress indicators and formatted output

### Development Tools

The repository uses several code quality tools:

- Ruff and Black for Python linting
- Biome for TypeScript and JavaScript linting
- Sourcery for code quality suggestions
- Trunk for developer tooling

## Understanding Each Utility Type

### Python Utilities

The Python utilities in this repository typically:

- Are organized as small, focused command-line tools
- Use Rich library for enhanced terminal output (colorized text, progress bars, etc.)
- Have a clear separation between CLI interface and core functionality
- Focus on file operations, especially for metadata and media files
- Use type hints and follow modern Python practices

Key characteristics:

- Tools are designed for specific workflows around media files
- Command-line interfaces provide options for dry-run modes
- Utilities have verbose logging to help with troubleshooting

### Fish Shell Scripts

The Fish shell scripts:

- Use Fish's specific syntax and features
- Often automate common tasks or enhance terminal experiences
- Include detailed comments and documentation within the scripts
- Are standalone and don't require installation

### Configuration Guides

The configuration guides like the netflow documentation:

- Provide step-by-step instructions for complex setups
- Include Docker compose configurations
- Offer troubleshooting guidance
- Present multiple options based on user preferences

### TypeScript Utilities

The TypeScript utilities in the repository:

- Are built with modern TypeScript features and practices
- Often involve automation of development workflows
- Include comprehensive command-line interfaces with multiple options
- May integrate with external APIs and services

### Image Resources

The image resources in the repository:

- Are organized by purpose and format
- Include both project-specific and multipurpose images
- May require specific software to view or edit (e.g., Adobe Photoshop, Figma)

## Assisting with Common Tasks

### For Python Utilities

1. **Installation and Dependencies**:

   - Guide users on installing required dependencies
   - Explain Python version requirements
   - Suggest using virtual environments for isolated installations

2. **Usage Guidance**:

   - Explain command-line options and their effects
   - Recommend starting with dry-run modes for file operations
   - Provide examples with common use cases

3. **Troubleshooting**:
   - Help interpret error messages from the tools
   - Suggest checking file permissions for file operation issues
   - Recommend reviewing logs for detailed error information

### For Fish Shell Scripts

1. **Installation**:

   - Explain how to make scripts executable: `chmod +x script.fish`
   - Guide on adding scripts to Fish functions for easier access

2. **Compatibility**:

   - Check if the user is using Fish shell
   - For scripts like sixkcd.fish, verify terminal compatibility (iTerm2 or sixel support)

3. **Customization**:
   - Help with modifying script variables for different behaviors
   - Explain how to adapt scripts to user environments

### For TypeScript Utilities

1. **Installation and Setup**:

   - Guide users on installing dependencies: `bun install` or `npm install`
   - Explain how to build TypeScript projects: `bun run build` or `npm run build`
   - Advise on creating symlinks for easier access

2. **Usage Guidance**:

   - Explain command-line options and their effects
   - Provide examples for common use cases
   - Suggest appropriate flags based on user's needs

3. **Customization**:
   - Help with modifying configuration options
   - Explain how to extend functionality for specific needs

### For Configuration Guides

1. **Implementation**:

   - Break down complex setups into manageable steps
   - Verify prerequisite knowledge and tools
   - Explain the purpose of each configuration component

2. **Adaptation**:
   - Help users adjust configurations for their specific environments
   - Suggest reasonable defaults for configuration options

## Best Practices for Code Suggestions and Troubleshooting

1. **Code Modifications**:

   - Respect the existing code style and patterns
   - Maintain compatibility with Python 3.6+ for Python utilities
   - Preserve type hints and docstrings when suggesting changes
   - For Fish scripts, ensure changes follow Fish syntax and idioms

2. **Error Analysis**:

   - Look for common issues first:
     - Missing dependencies
     - File permission problems
     - Invalid file paths
   - For Python tools, suggest debugging with increased verbosity

3. **Feature Additions**:

   - Recommend implementing new features as separate functions
   - Suggest maintaining the existing error handling patterns
   - For Python tools, follow the Rich library patterns for consistent UI
   - For TypeScript tools, maintain type safety and follow existing patterns

4. **Testing Suggestions**:
   - Recommend testing file operations in dry-run mode first
   - Suggest validating input data before operations
   - For Fish scripts, propose echo statements to trace execution
   - For TypeScript tools, recommend using the `--dry-run` flag if available

## Example Responses

### Example 1: User asking about orphaned-xmp usage

```bash
To find orphaned XMP files in your photography directory, you can use the orphaned-xmp tool like this:

1. Navigate to your photos directory:
   cd ~/Photos

2. Run the tool in dry-run mode first to see what would be deleted:
   python /path/to/myriad/python/orphaned-xmp/orphaned_xmp/cli.py --dry-run

3. If the results look correct and you want to delete the orphaned files:
   python /path/to/myriad/python/orphaned-xmp/orphaned_xmp/cli.py --delete

The tool will:
- Find all XMP files in the directory
- Check if each XMP file has a corresponding media file
- Report (or delete) XMP files without matching media files

This helps clean up your photo library by removing metadata files for images you've deleted.
```

### Example 2: User asking about modifying sixkcd.fish

````fish
To modify the sixkcd.fish script to display comics at a different size, you'll want to edit the image processing part of the script.

Look for this line around line 162:

```fish
fetch_url $xkcd_imgurl | magick - -resize 250% - | $DISPLAY_IMAGE
````

Change the 250% value to adjust the size. For example, to make it smaller:

```fish
fetch_url $xkcd_imgurl | magick - -resize 150% - | $DISPLAY_IMAGE
```

Or to make it larger:

```fish
fetch_url $xkcd_imgurl | magick - -resize 350% - | $DISPLAY_IMAGE
```

This works because the script uses ImageMagick to resize the image before displaying it with either imgcat (for iTerm2) or img2sixel (for terminals with sixel support).

Remember to make the script executable after editing:
chmod +x sixkcd.fish

```markdown
### Example 3: User asking about netflow setup
```

To set up the netflow monitoring system described in the guide, you'll need to follow these steps:

1. First, make sure you have the prerequisites:

   - A server/VM running Docker and Docker Compose
   - A Mikrotik router running RouterOS 7
   - Basic networking knowledge

2. Create the docker-compose.yml file:

   - Copy the example from the netflow/README.md file
   - Save it to a directory on your server

3. Create the ntopng.conf file in the same directory with the configuration from the guide

4. Start the Docker containers:

   ```bash
   docker-compose up -d
   ```

5. Configure your Mikrotik router:

   - Enable Traffic Flow (IP → Traffic Flow)
   - Add your Docker host as a target with port 2055 and version 9

6. Verify it's working:
   - Check container logs: `docker-compose logs -f`
   - Access ntopng web interface at <http://your-server-ip:3000>

The most common issues are:

- Firewall blocking UDP port 2055
- Incorrect IP address configuration
- Missing volumes for persistent data

Would you like me to help with any specific part of this setup?

```text

### Example 4: User asking about the bump utility

```text
To use the bump utility for updating dependencies across your repositories:

1. Basic usage:
   ```bash
   # Update all repositories
   bump

   # Update a specific repository
   bump your-repo-name
   ```

2. If you want to see what would be updated without making changes:
   ```bash
   bump --dry-run
   ```

3. To update all dependencies including major versions (which are skipped by default):
   ```bash
   bump --unsafe
   ```

4. To skip certain git operations:
   ```bash
   # Skip committing changes
   bump --no-commit

   # Skip pushing changes
   bump --no-push
   ```

The tool will:
- Find repositories to process
- Check for outdated dependencies
- Apply updates based on semantic versioning rules
- Update lockfiles
- Commit and push changes (unless disabled)

It supports JavaScript/TypeScript (package.json), Python (pyproject.toml), and Ruby (Gemfile, gemspec) projects.
```text

```markdown
## Final Notes

When working with this repository:

1. **Understand the scope**: Each utility solves a specific problem rather than being a general-purpose application.

2. **Consider the environment**: Many tools assume a macOS environment with specific terminal capabilities.

3. **Acknowledge tool maturity**: These are personal utilities that may not have extensive error handling or documentation.

4. **Respect coding style**: Follow the established patterns when suggesting modifications to maintain consistency.
```
