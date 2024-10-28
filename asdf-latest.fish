function asdf-latest
  echo "updating asdf..." 1>&2
  asdf update --head > /dev/null 2>/dev/null
  echo "updating plugins..." 1>&2
  asdf plugin update --all > /dev/null 2>/dev/null
  echo "getting latest versions..." 1>&2
  for i in (asdf plugin list)
    echo -n "$i "
    asdf latest $i
  end
end
