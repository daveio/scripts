# `mullvad`

Utility to generate Mikrotik configuration scripts from Mullvad configuration files.

Uses `uv` for package management.

## Getting the config files

Use the Mullvad web interface to download the config files. You can generate [WireGuard][link-wg] and [OpenVPN][link-ovpn] configurations.

If you want to generate config for multiple servers, you can set the 'Country' chooser to **All countries** which by default will let you download a zip file with configuration for every Mullvad server. You can then run this utility against all of them by running it in a shell loop.

## Usage

### `mullvad keygen`

Generate public/private keypair for Wireguard.

`-m INTERFACE` - Generate Mikrotik script to set key on interface `INTERFACE`.

`-s` - Print keys to be used by a script as `PRIVATEKEY PUBLICKEY`.

### `mullvad wireguard [file]`

Generate Mikrotik script for WireGuard config using the config file.

`-i PREFIX` - Use `PREFIX` before interface names.

`-p PREFIX` - Use `PREFIX` before peer names.

### `mullvad openvpn [userpass] [certificate] [config]`

Generate Mikrotik script for OpenVPN config using the userpass file, the certificate, and the config file itself

`-i PREFIX` - Use `PREFIX` before interface names.

[link-wg]: https://mullvad.net/en/account/wireguard-config
[link-ovpn]: https://mullvad.net/en/account/openvpn-config
