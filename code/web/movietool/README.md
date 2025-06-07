# `movietool`

Tool to detect and identify multiple copies of the same movie, and generate a deletion script for the extra copies.

Features [Catppuccin](https://github.com/catppuccin) theming.

![Catppuccin Theme](https://github.com/daveio/movietool/raw/main/images/catppuccin.webp)

## Features

- **Directory Scanning**: Scan movie directories for multiple video files (.mp4, .avi, .mkv)
- **Intelligent Analysis**: Automatically identifies the largest file as the main movie and flags smaller duplicates
- **Trailer Exclusion**: Ignores trailer files (with "-trailer" in the name)
- **Deletion Script Generation**: Creates Bash (Linux/Mac) or Batch (Windows) scripts for removing duplicates
- **Visual Statistics**: Displays file distribution and potential disk space savings
- **Catppuccin Theming**: Beautiful, modern UI with light and dark mode support

## Installation

### Requirements

- [`python/cpython`](https://github.com/python/cpython) (3.13 or higher)
- [`astral-sh/uv`](https://github.com/astral-sh/uv)
- [`jdx/mise`](https://github.com/jdx/mise)

### Setup

1. Clone the repository.

```bash
git clone https://github.com/daveio/movietool.git
cd movietool
```

2. Install dependencies.

```bash
mise install
```

3. Start the application.

```bash
mise start
```

4. Visit the URL printed to the terminal.

### Development

You can reset the database (ie, delete the SQLite file).

```bash
mise reset
```

## Usage

1. **Enter the path** to your movie directory
2. **Customize scan options** if needed (file extensions, patterns)
3. **Click "Scan Directory"** to analyze the files
4. **Review the results** - the largest file in each directory is kept, others are flagged
5. **Generate a deletion script** - choose Bash or Batch depending on your OS
6. **Execute the script** to remove duplicate files

## File Selection Logic

- The application considers the largest video file in each directory as the main movie file
- All other video files in the same directory are flagged for potential deletion
- Trailer files with "-trailer" in the name are automatically excluded from consideration

## Customization

The interface uses the Catppuccin color scheme with both dark (Frappé) and light (Latte) themes:

- **Dark Theme (Frappé)**: Base #303446, Text #c6d0f5, Surface #292c3c, Overlay #414559, Accent #8caaee
- **Light Theme (Latte)**: Base #eff1f5, Text #4c4f69, Surface #e6e9ef, Overlay #ccd0da, Accent #1e66f5

Toggle between themes using the moon/sun icon in the top-right corner.

## License

[MIT License](LICENSE)
