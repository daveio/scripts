import os
from json import dump, load
from typing import Any, Dict

import click
from util import default_state_file


def ensure_dir(path: str) -> None:
    """Creates the specified directory if it doesn't already exist."""
    if not os.path.exists(path):
        os.makedirs(path)


def init_portgen(
    starting_port: int, run_name: str, state_file: str = default_state_file
) -> str:
    ensure_dir(click.get_app_dir("mullvad"))
    with open(state_file, "w") as f:
        dump({run_name: starting_port}, f)
    return "Ready to generate ports with portgen run"


def run_portgen(run_name: str, state_file: str) -> int:
    with open(state_file, "r") as f:
        data: Dict[str, Any] = load(f)
    port: int = data[run_name]
    next_port: int = port + 1
    with open(state_file, "w") as f:
        dump({run_name: next_port}, f)
    return port
