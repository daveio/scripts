import os
from typing import Optional

import click
from keypair import compose_keypair
from meta import version as mullvad_version
from openvpn import compose_openvpn
from portgen import init_portgen, run_portgen
from wireguard import compose_wireguard


@click.group()
def cli() -> None:
    pass


@cli.command()
def version() -> None:
    click.echo(f"mullvad {mullvad_version}")


@cli.command()
@click.option(
    "-m",
    "mikrotik_interface",
    help="Generate Mikrotik script to set key on interface TEXT",
)
@click.option(
    "-s",
    "print_script",
    is_flag=True,
    show_default=True,
    default=False,
    help="Print keys for a script, as PRIVATEKEY PUBLICKEY",
)
def keygen(mikrotik_interface: Optional[str], print_script: bool) -> None:
    click.echo(compose_keypair(mikrotik_interface, print_script))


@cli.command()
@click.argument("config_file", type=click.Path(exists=True))
@click.option(
    "-i", "interface_prefix", help="Prefix interface names with TEXT", default="wg-"
)
@click.option(
    "-p", "peer_prefix", help="Prefix created peer names with TEXT", default="peer-"
)
@click.option(
    "-l", "listen_port", help="Listen port for WireGuard interface", default=51820
)
def wireguard(
    config_file: str, interface_prefix: str, peer_prefix: str, listen_port: int
) -> None:
    click.echo(
        compose_wireguard(config_file, interface_prefix, peer_prefix, listen_port)
    )


@cli.command()
@click.argument("userpass_file", type=click.Path(exists=True))
@click.argument("certificate_file", type=click.Path(exists=True))
@click.argument("config_file", type=click.Path(exists=True))
@click.option("-i", "interface_prefix", help="Prefix created interface names with TEXT")
def openvpn(
    userpass_file: str,
    certificate_file: str,
    config_file: str,
    interface_prefix: Optional[str],
) -> None:
    click.echo(
        compose_openvpn(userpass_file, certificate_file, config_file, interface_prefix)
    )


@cli.group()
def portgen() -> None:
    pass


@portgen.command()
@click.argument("starting_port", type=int, default=51820)
@click.option("-n", "run_name", type=str, help="Name of this run", default="unnamed")
@click.option(
    "-f",
    "state_file",
    help="File to keep state over multiple invocations",
    default=os.path.join(click.get_app_dir("mullvad"), "state.json"),
)
def init(starting_port: int, run_name: str, state_file: str) -> None:
    click.echo(init_portgen(starting_port, run_name, state_file))


@portgen.command()
@click.option("-n", "run_name", type=str, help="Name of this run", default="unnamed")
@click.option(
    "-f",
    "state_file",
    help="File to keep state over multiple invocations",
    default=os.path.join(click.get_app_dir("mullvad"), "state.json"),
)
def run(run_name: str, state_file: str) -> None:
    click.echo(run_portgen(run_name, state_file))


if __name__ == "__main__":
    cli()
