#!/usr/bin/env fish
#
# Display an xkcd comic using sixel graphics.
#
# Based on a bash script by https://gitlab.com/Matrixcoffee
# Ported to fish by https://github.com/daveio
#
# USAGE
#
# sixkcd : Display the latest xkcd.
# sixkcd NUMBER : Display the xkcd with the given NUMBER.
#
# ABOUT
#
# Uses iTerm2's imgcat if it can find it; this is quicker but can pop up
# a warning on first use. You can either set IGNORE_IMGCAT to true in the
# configuration section below, or tick the box in the iTerm2 alert to
# suppress the warning in future.
#
# Set CHECK_ITERM2 to false in the configuration section if you want to
# use this script with a different terminal. Make sure it supports Sixel
# graphics on https://arewesixelyet.com and you probably want to set
# IGNORE_IMGCAT to true if you also have iTerm2 installed so that it uses
# img2sixel instead of trying imgcat, which might work or might not.
#
# CONFIGURATION
#
# You can set the following variables in the [ Configuration ] section,
# or set them in your environment.
#
# CHECK_ITERM2: enable terminal detection
# IGNORE_IMGCAT: force use of img2sixel
# SHOW_ITERM2_WARNING: show message if iTerm2 is not detected
#
# DEPENDENCIES
#
# imagemagick
#   brew install imagemagick
#
# iTerm2's imgcat
#   iTerm2 shell integration
# or img2sixel
#   brew install libsixel
#
# python 3
#   brew install python
#   or use your preferred version manager
#
# curl
#   brew install curl
#   fish_add_path (brew --prefix curl)/bin
# or wget
#   brew install wget

# [ Configuration ]

set -q CHECK_ITERM2; or set CHECK_ITERM2 true
set -q IGNORE_IMGCAT; or set IGNORE_IMGCAT false
set -q SHOW_ITERM2_WARNING; or set SHOW_ITERM2_WARNING true



# [ Parameters ]

set xkcdnumber $argv[1]

# [ Terminal ]

if test "$CHECK_ITERM2" = true
    if test "$TERM_PROGRAM" != "iTerm.app"
      if test "$SHOW_ITERM2_WARNING" = true
        echo "No xkcd for you, this isn't iTerm2!"
      end
      exit 0
    end
end

# [ Tooling ]

if test "$IGNORE_IMGCAT" = true
    # Force img2sixel if IGNORE_IMGCAT is set
    if type -q img2sixel
        set DISPLAY_IMAGE img2sixel
    else
        echo "Error: IGNORE_IMGCAT is set, but I can't find img2sixel." 1>&2
    end
else
    if type -q imgcat
        set DISPLAY_IMAGE imgcat
    else if type -q img2sixel
        set DISPLAY_IMAGE img2sixel
    else
        echo "Error: can't find imgcat or img2sixel." 1>&2
        exit 127
    end
end

# [ Functions ]

function error --description "Print error message and exit"
    echo "Error: $argv" 1>&2
    exit 127
end

function wordwrap --description "Word wrap with auto terminal width detection"
    set -l width 60
    set -l defaultwidth 60
    set -l ww cat

    test -n "$width"; or test -t 1; or set width $defaultwidth
    test -n "$width"; or set width $COLUMNS
    test -n "$width"; or set width (tput cols)
    test -n "$width"; or set width $defaultwidth

    test -x /usr/bin/fmt; and set ww /usr/bin/fmt -w $width
    test -x /usr/bin/par; and set ww /usr/bin/par $width

    eval $ww
end

function fetch_url --argument-names url
    if type -q curl
        curl -sSL $url
    else if type -q wget
        wget --no-verbose --retry-on-host-error -O - -- $url
    end
end

function fetch_xkcd --argument-names xkcdnumber
    set -l url
    if test -n "$xkcdnumber"
        set url "https://xkcd.com/$xkcdnumber/info.0.json"
    else
        set url "https://xkcd.com/info.0.json"
    end
    fetch_url $url
end

function decode_xkcd
    python3 -c 'if __name__ == "__main__":
        import json
        import sys
        j = json.load(sys.stdin)
        for k in "num safe_title img year month day alt".split():
            print(j[k])'
end

# [ Main ]

set xkcd_data (fetch_xkcd $xkcdnumber | decode_xkcd)
    or error "Metadata download failed."

set xkcd_number $xkcd_data[1]
set xkcd_safe_title $xkcd_data[2]
set xkcd_imgurl $xkcd_data[3]
set xkcd_year $xkcd_data[4]
set xkcd_month $xkcd_data[5]
set xkcd_day $xkcd_data[6]
set xkcd_alt $xkcd_data[7..-1]

set xkcd_siximg (
    fetch_url $xkcd_imgurl | magick - -resize 250% - | $DISPLAY_IMAGE
)
    or error "Image download failed."

echo $xkcd_siximg
echo $xkcd_alt | wordwrap
echo
