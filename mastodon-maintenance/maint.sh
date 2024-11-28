RAILS_ENV=production bin/tootctl cache clear
RAILS_ENV=production bin/tootctl media remove-orphans
RAILS_ENV=production bin/tootctl media remove --days=7 --verbose
RAILS_ENV=production bin/tootctl media remove --days=7 --prune-profiles --include-follows --verbose
RAILS_ENV=production bin/tootctl media remove --days=7 --remove-headers --include-follows --verbose
RAILS_ENV=production bin/tootctl preview_cards remove --days=7
RAILS_ENV=production bin/tootctl statuses remove --days=7 --clean-followed --compress-database # locks db
