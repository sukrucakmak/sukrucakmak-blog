---
title: SSH Config, Key Management and Tunneling
description: "Generating ed25519 keys, ssh-agent, shortcuts with ~/.ssh/config, jump hosts, port forwarding (-L, -R, -D) and server-side hardening."
date: 2026-10-31
tags: [ssh, linux, security, guide]
translation: /blog/ssh-config-and-tunneling
---

## Introduction

For many of us SSH is just typing `ssh root@1.2.3.4` and entering a password. A few minutes of setup gives you something far more secure and far faster: passwordless key login, shortcuts like `ssh prod`, connecting through a bastion in one command, and reaching a remote database through a local port.

## 1. Generating a key

```bash
ssh-keygen -t ed25519 -C "sukru@laptop"
# ~/.ssh/id_ed25519      → private key (never shared)
# ~/.ssh/id_ed25519.pub  → public key (added to servers)
```

`ed25519` is shorter and faster than RSA and is the currently recommended algorithm. If an old system needs RSA, use at least 4096 bits: `ssh-keygen -t rsa -b 4096`.

A passphrase keeps the key unusable even if the file is stolen. To add or change one later:

```bash
ssh-keygen -p -f ~/.ssh/id_ed25519
```

## 2. Adding the public key to a server

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@203.0.113.10
```

Without `ssh-copy-id` (e.g. on Windows) you can do the same by hand:

```bash
cat ~/.ssh/id_ed25519.pub | ssh deploy@203.0.113.10 \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## 3. ssh-agent

To avoid typing the passphrase on every connection, add the key to the agent:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l                 # keys in the agent
ssh-add -D                 # remove all
```

On macOS, store the passphrase in the Keychain with `ssh-add --apple-use-keychain ~/.ssh/id_ed25519`.

## 4. Shortcuts with ~/.ssh/config

Instead of typing user, IP, port and key every time:

```bash
# ~/.ssh/config
Host prod
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host staging
    HostName 203.0.113.20
    User deploy

Host github.com
    IdentityFile ~/.ssh/id_ed25519_github

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

Now `ssh prod`, `scp app.jar prod:/opt/app/` and `rsync -az dist/ prod:/var/www/` just work.

- `IdentitiesOnly yes` uses only the given key instead of trying every key in the agent; it prevents "Too many authentication failures".
- `ServerAliveInterval` keeps idle connections from being dropped by firewalls/NAT.
- The **first matching value** wins, so put the `Host *` block at the end of the file.

## 5. Jump host (bastion)

When a server on a private network is reachable only through a bastion:

```bash
ssh -J deploy@bastion.example.com deploy@10.0.1.15
```

To make it permanent in the config:

```bash
Host bastion
    HostName bastion.example.com
    User deploy

Host db-server
    HostName 10.0.1.15
    User deploy
    ProxyJump bastion
```

`ssh db-server` now hops through both servers in one step. The private key is never copied to the bastion.

## 6. Port forwarding (tunneling)

### Local forwarding (-L)

Reach a service on the remote server that isn't exposed, from your own machine. For example PostgreSQL listening only on the server's `localhost:5432`:

```bash
ssh -N -L 5433:localhost:5432 prod
# Locally: psql -h localhost -p 5433 -U app
```

`-N` runs no remote command and just keeps the tunnel open. Add `-f` to send it to the background.

Through a bastion to another server on the private network:

```bash
ssh -N -L 6380:10.0.1.20:6379 bastion    # local 6380 → 10.0.1.20:6379 (Redis)
```

### Remote forwarding (-R)

The reverse: makes a service on your machine reachable through the remote server.

```bash
ssh -N -R 8080:localhost:3000 prod
# On the server: curl localhost:8080 → :3000 on your machine
```

### Dynamic forwarding (-D)

Opens a local SOCKS proxy, e.g. to route browser traffic through the server:

```bash
ssh -N -D 1080 prod
curl --socks5-hostname localhost:1080 https://ifconfig.me
```

| Flag | Direction | Typical use |
| --- | --- | --- |
| `-L local:target:port` | Local → remote | Reach a remote DB/admin panel |
| `-R remote:target:port` | Remote → local | Temporarily expose a local service |
| `-D port` | SOCKS proxy | Send all traffic out through the server |

## 7. Copying files

```bash
scp app.jar prod:/opt/app/
scp -r prod:/var/log/myapp ./logs
rsync -avz --progress dist/ prod:/var/www/app/
rsync -avz --delete -e "ssh -p 2222" dist/ deploy@203.0.113.10:/var/www/app/
sftp prod
```

Prefer `rsync` for large or repeated transfers: it sends only changed files and can resume an interrupted transfer.

## 8. Server-side hardening

**After** confirming key login works, set in `/etc/ssh/sshd_config`:

```bash
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
```

```bash
sudo sshd -t                       # test the configuration
sudo systemctl reload sshd         # the service is called ssh on Ubuntu
```

> Don't close your current SSH session while applying this. Keep it open until you've confirmed you can connect from a new terminal; otherwise you may lock yourself out.

Installing `fail2ban` is a good extra measure against brute-force attempts.

## 9. Troubleshooting

| Error | Cause / Fix |
| --- | --- |
| `Permission denied (publickey)` | The public key isn't in `authorized_keys` or wrong user; see which key is tried with `ssh -v` |
| Key is set up but it still asks for a password | Wrong permissions: `~/.ssh` 700, `authorized_keys` 600, home dir not writable by others |
| `UNPROTECTED PRIVATE KEY FILE` | `chmod 600 ~/.ssh/id_ed25519` |
| `Too many authentication failures` | Add `IdentitiesOnly yes` and the right `IdentityFile` to the config |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | If the server was reinstalled, `ssh-keygen -R 203.0.113.10`; otherwise be careful, it could be MITM |
| Idle connections drop | `ServerAliveInterval 60` |
| `bind: Address already in use` (tunnel) | The local port is taken; pick another one |

For any connection problem, the first step is verbose output: `ssh -v prod` (`-vvv` for more).

## Conclusion

An ed25519 key, a well-organized `~/.ssh/config` and tunnels opened with `-L` turn SSH from "the tool for logging into servers" into the center of daily work. On the server side, disabling password and root logins are the two most effective security measures you can take.
