# `boneyard`

Retired code, made available by request.

## I want some of your old work

Great! [Open a content request Issue][link-content-request-issue].

## Current contents

### `proxmark3-install-script` (No ticket, requested out of band)

The file `pm3-setup.sh` in this directory is my Proxmark3 installer script. Originally written for Ubuntu 14.04, it won't run without modification on later distributions. If you want to use it you'll need to make the requisite modifications. Feel free to submit a PR with your updated version if you like - just because I've retired it doesn't mean it can't be contributed to!

### `mullvad-tool` ([#20](https://github.com/daveio/boneyard/issues/20))

A Python utility for generating Mikrotik configuration scripts from Mullvad VPN configuration files. Provides several commands:

- `mullvad keygen`: Generate WireGuard public/private keypairs
- `mullvad wireguard`: Generate Mikrotik scripts from Mullvad WireGuard config files
- `mullvad openvpn`: Process Mullvad OpenVPN configurations (partially implemented)
- `mullvad portgen`: Port generator utility for managing WireGuard listening ports

It includes a helper fish shell script for batch processing multiple WireGuard configurations, which will need adaptation for your own environment as it was never developed further than my own use case.

[link-content-request-issue]: https://github.com/daveio/boneyard/issues/new?assignees=daveio&labels=content-request&template=content-request.md&title=%5BContent+request%5D+%3Cshort+description%3E
