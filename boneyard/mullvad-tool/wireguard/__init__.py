import re
import secrets
from typing import Optional, Tuple

import chevron
from wireguard_tools import WireguardConfig


def parse_wireguard_config(config_path: str) -> Optional[dict]:
    try:
        with open(config_path, "r") as f:
            return WireguardConfig.from_wgconfig(f).asdict()
    except FileNotFoundError:
        return None


def compose_wireguard(
    config_file: str,
    interface_prefix: Optional[str],
    peer_prefix: Optional[str],
    listen_port: int,
) -> str:
    interface, peer = generate_wireguard(
        config_file, interface_prefix, peer_prefix, listen_port
    )
    if interface is None or peer is None:
        return "Failed to generate WireGuard configuration"
    retval = interface
    retval = retval + "\n"
    retval = retval + peer
    retval = retval + "\n"
    return retval


def generate_wireguard(
    config_file: str,
    interface_prefix: Optional[str],
    peer_prefix: Optional[str],
    listen_port: int,
) -> Tuple[Optional[str], Optional[str]]:
    config = parse_wireguard_config(config_file)
    if config is None:
        return None, None
    if match := re.search(r"([^/]+)\.conf$", config_file):
        interface_name = match[1]
    else:
        interface_name = secrets.token_hex(4)
    interface_text = generate_wireguard_interface(
        interface_name, interface_prefix, config["private_key"], listen_port
    )
    peer_text = generate_wireguard_peer(
        interface_name, peer_prefix, interface_name, config
    )
    return interface_text, peer_text


def generate_wireguard_interface(
    interface_name: str, interface_prefix: Optional[str], private_key: str, port: int
) -> str:
    if interface_prefix is not None:
        interface_name = interface_prefix + interface_name
    template = """  /interface/wireguard/add \\
        add listen-port={{ listen_port }} \\
        mtu=1420 \\
        name={{ interface_name }} \\
        private-key={{ private_key }} \\
        disabled=yes
    """
    return chevron.render(
        template,
        {
            "interface_name": interface_name,
            "private_key": private_key,
            "listen_port": port,
        },
    )


def generate_wireguard_peer(
    peer_name: str, peer_prefix: Optional[str], interface_name: str, config: dict
) -> str:
    peer_config = config["peers"][0]
    if peer_prefix is not None:
        peer_name = peer_prefix + peer_name + "-" + str(peer_config["endpoint_port"])
    template = """ /interface/wireguard/peer/add \\
        allowed-address=0.0.0.0/0,::/0 \\
        client-address={{ clientv4 }},{{ clientv6 }} \\
        client-dns={{ clientdns }} \\
        endpoint-address={{ endpoint }} \\
        endpoint-port={{ eport }} \\
        interface={{ pifname }} \\
        name={{ peername }} \\
        public-key="{{ pubkey }}=" \\
        disabled=yes
    """
    return chevron.render(
        template,
        {
            "clientv4": config["addresses"][0],
            "clientv6": config["addresses"][1],
            "clientdns": config["dns_servers"][0],
            "endpoint": peer_config["endpoint_host"],
            "eport": peer_config["endpoint_port"],
            "pifname": interface_name,
            "peername": peer_name,
            "pubkey": peer_config["public_key"],
        },
    )
