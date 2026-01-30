import socket
import requests
import netifaces

def get_public_ip():
    try:
        return requests.get("https://api.ipify.org?format=json", timeout=10).json()["ip"]
    except Exception:
        return None

def get_private_ips():
    ips = []
    for iface in netifaces.interfaces():
        addrs = netifaces.ifaddresses(iface)
        if netifaces.AF_INET in addrs:
            for link in addrs[netifaces.AF_INET]:
                ip = link.get("addr")
                if ip and not ip.startswith("127."):
                    ips.append(ip)
    return ips
