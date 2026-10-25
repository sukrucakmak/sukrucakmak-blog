---
title: "Linux Networking and Troubleshooting Commands: curl, ss, dig, tcpdump"
description: "Finding out step by step why a service can't be reached — ip, ping, dig, curl, ss, traceroute/mtr, nc, tcpdump and firewall commands."
date: 2026-11-04
tags: [linux, network, devops, guide]
translation: /blog/linux-network-troubleshooting
---

## Introduction

Behind a "the service is unreachable" complaint there can be dozens of causes: DNS resolves wrong, nothing listens on the port, a firewall blocks it, the certificate is invalid, or the app only listens on `localhost`. With the right commands you can tell which one in a few minutes.

This post lists the commands used to narrow the problem down layer by layer: interface → DNS → connectivity → port → application → packets.

## 1. Interfaces, IPs and routes

```bash
ip a                         # interfaces and IP addresses (ip addr)
ip -br a                     # brief summary
ip r                         # routing table; "default via" → gateway
ip r get 8.8.8.8             # which interface/gateway reaches this target
ip link set eth0 up
hostname -I                  # the server's IPs
curl -s ifconfig.me          # public IP as seen from outside
```

`ifconfig`, `netstat` and `route` come from the `net-tools` package, which most distributions no longer install by default; `ip` and `ss` replaced them.

## 2. Reachability: ping, traceroute, mtr

```bash
ping -c 4 example.com        # send 4 packets
ping -c 4 -W 2 10.0.1.15     # 2 s timeout
traceroute example.com       # routers along the path
tracepath example.com        # alternative that needs no root
mtr -rwc 50 example.com      # ping + traceroute, loss/latency report per hop
```

> No `ping` reply doesn't mean the server is down. Many cloud providers and firewalls block ICMP; test the TCP port directly in the next step.

## 3. DNS: dig, nslookup, getent

```bash
dig example.com              # A record, TTL, answering server
dig +short example.com
dig example.com AAAA         # IPv6
dig example.com MX
dig example.com TXT          # SPF, verification records
dig @8.8.8.8 example.com     # ask a specific DNS server
dig +trace example.com       # resolution chain from the root
dig -x 203.0.113.10          # reverse (PTR) lookup
nslookup example.com
getent hosts example.com     # what the system actually uses (including /etc/hosts)
resolvectl status            # DNS servers on systems using systemd-resolved
cat /etc/resolv.conf
```

`dig` asks DNS directly; `getent hosts` returns what applications see, `/etc/hosts` included. If they differ, the problem is usually `/etc/hosts` or a local cache.

If you just changed a DNS record, the old value can stay in caches until its TTL expires; the TTL in `dig` output shows the time remaining.

## 4. HTTP: curl

```bash
curl https://api.example.com/health
curl -I https://example.com                 # headers only
curl -v https://example.com                 # DNS, TCP, TLS handshake, headers
curl -L http://example.com                  # follow redirects
curl -sS -o /dev/null -w "%{http_code}\n" https://example.com
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Sukru"}'
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/me
curl --max-time 5 https://example.com
curl -k https://self-signed.local           # skip certificate verification (testing only)
curl --resolve example.com:443:203.0.113.10 https://example.com   # bypass DNS, hit a specific IP
```

Timing output to see where a response slows down:

```bash
curl -sS -o /dev/null -w "dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n" https://example.com
```

`--resolve` is very handy for testing a new server before switching DNS, or for trying a single node behind a load balancer.

## 5. Ports and connections: ss, lsof

```bash
ss -tlnp                     # listening TCP ports and processes
ss -ulnp                     # listening UDP ports
ss -tnp                      # established TCP connections
ss -tn state established '( dport = :5432 )'   # connections to PostgreSQL
ss -s                        # summary statistics
sudo lsof -i :8080           # process using 8080
sudo fuser -k 8080/tcp       # kill the process using 8080
```

| `ss` flag | Meaning |
| --- | --- |
| `-t` / `-u` | TCP / UDP |
| `-l` | Listening sockets only |
| `-n` | No name resolution (show port numbers) |
| `-p` | Show the process (sudo for other users' processes) |

Watch the **Local Address** column in `ss -tlnp`: `127.0.0.1:8080` is reachable only from the server itself, `0.0.0.0:8080` or `*:8080` from every interface. It's the most common cause of "works locally, unreachable from outside".

## 6. Testing a TCP port: nc

```bash
nc -zv db.example.com 5432           # is the port open?
nc -zv 10.0.1.15 20-25               # a port range
timeout 3 bash -c '</dev/tcp/10.0.1.15/6379' && echo open || echo closed   # without nc
openssl s_client -connect example.com:443 -servername example.com </dev/null   # TLS and certificate chain
```

Reading the results:

| Result | Meaning |
| --- | --- |
| `succeeded` / `open` | The port is open and a process is listening |
| `Connection refused` | The host was reached but nothing listens on that port |
| Timeout | A firewall in between silently drops packets, or the host is unreachable |

## 7. Packet capture: tcpdump

When everything else looks fine but the problem persists, look at what's actually on the wire:

```bash
sudo tcpdump -i any port 8080                     # traffic on 8080
sudo tcpdump -i eth0 host 10.0.1.15               # a specific host
sudo tcpdump -i any -nn 'tcp port 443 and host 203.0.113.10'
sudo tcpdump -i any -nn port 53                   # DNS queries
sudo tcpdump -i any -A -s 0 port 80               # print HTTP content as ASCII
sudo tcpdump -i any -w capture.pcap port 5432     # write to a file for Wireshark
sudo tcpdump -r capture.pcap
```

`-nn` skips resolving IPs and ports, so output is both faster and easier to read. If you see `SYN` packets leaving the client but no `SYN-ACK` coming back from the server, the problem is a firewall or security group in between.

## 8. Firewalls

```bash
# firewalld (AlmaLinux / RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# ufw (Ubuntu)
sudo ufw status verbose
sudo ufw allow 8080/tcp

# nftables / iptables directly
sudo nft list ruleset
sudo iptables -L -n -v
```

On cloud servers, check the provider's **security group / cloud firewall** rules in addition to the OS firewall.

## 9. Step-by-step checklist

`https://api.example.com` is unreachable:

```bash
dig +short api.example.com                      # 1. Does DNS return the right IP?
nc -zv api.example.com 443                      # 2. Is the port open from outside?
curl -v https://api.example.com/health          # 3. What do TLS and HTTP return?
# On the server:
ss -tlnp | grep -E ':443|:8080'                 # 4. Are Nginx and the app listening, on which address?
curl -s localhost:8080/health                   # 5. Does the app answer locally?
sudo firewall-cmd --list-all                    # 6. Does the firewall allow it?
sudo tail -n 50 /var/log/nginx/error.log        # 7. What does the proxy say?
journalctl -u myapp -n 100                      # 8. What does the app say?
```

| Symptom | Likely cause |
| --- | --- |
| `Could not resolve host` | DNS record missing or wrong; check with `dig` |
| `Connection refused` | The service isn't running or wrong port |
| Timeout | Firewall / security group blocks it |
| Works locally, not from outside | The app is bound to `127.0.0.1` |
| `SSL certificate problem` | Expired certificate, incomplete chain or domain mismatch |
| `502` / `504` | The reverse proxy can't reach the app behind it, or it responds too slowly |

## Conclusion

Nearly every network problem can be diagnosed with the dozen or so commands in this post. The key is to keep the order: DNS first (`dig`), then the port (`nc`, `ss`), then the application (`curl -v`), and packets last (`tcpdump`). Each step narrows down where to look next and lets you isolate the problem in minutes instead of "trying everything".
