# security/ssh_crypto.py (exemple)
import paramiko

def harden_ssh_crypto():
    opts = paramiko.Transport._preferred_ciphers
    paramiko.Transport._preferred_ciphers = [
        "aes256-ctr",
        "aes192-ctr",
        "aes128-ctr",
    ]
