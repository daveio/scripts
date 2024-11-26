RAILS_ENV=production bin/tootctl cache clear
RAILS_ENV=production bin/tootctl media remove-orphans
RAILS_ENV=production bin/tootctl media remove --days=7 --prune-profiles --remove-headers --include-follows
RAILS_ENV=production bin/tootctl media remove --days=7 --remove-headers --include-follows
