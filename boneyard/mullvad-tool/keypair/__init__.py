from codecs import encode
from textwrap import dedent
from typing import Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from util import Keypair


def compose_keypair(mikrotik_interface: Optional[str], print_script: bool) -> str:
    keypair: Keypair = generate_keypair()
    if mikrotik_interface is not None:
        return "Not yet implemented"
    if print_script:
        return f"{keypair.private} {keypair.public}"
    return dedent(
        f"""
        Private key : {keypair.private}
        Public key  : {keypair.public}
        """
    )


def generate_keypair() -> Keypair:
    encoding: serialization.Encoding = serialization.Encoding.Raw
    priv_format: serialization.PrivateFormat = serialization.PrivateFormat.Raw
    pub_format: serialization.PublicFormat = serialization.PublicFormat.Raw
    private_key: X25519PrivateKey = X25519PrivateKey.generate()
    private_bytes: bytes = private_key.private_bytes(
        encoding=encoding,
        format=priv_format,
        encryption_algorithm=serialization.NoEncryption(),
    )
    private_text: str = encode(private_bytes, "base64").decode("utf8").strip()
    public_bytes: bytes = private_key.public_key().public_bytes(
        encoding=encoding, format=pub_format
    )
    public_text: str = encode(public_bytes, "base64").decode("utf8").strip()
    return Keypair(private_text, public_text)
