import os
from typing import Final

import click


class Keypair:
    def __init__(self, private: str, public: str) -> None:
        self.private: str = private
        self.public: str = public

    def __repr__(self) -> str:
        return f"Keypair(private={self.private}, public={self.public})"


default_state_file: Final[str] = os.path.join(
    click.get_app_dir("mullvad-tool"), "state.json"
)
