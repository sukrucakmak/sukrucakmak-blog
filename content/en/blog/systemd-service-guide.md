---
title: Writing a Linux Service with systemd
description: "Running an app as a systemd service — unit files, restart policies, environment variables, reading logs with journalctl, and scheduled jobs with timers."
date: 2026-10-30
tags: [linux, systemd, devops, guide]
translation: /blog/systemd-service-guide
---

## Introduction

Starting a Java jar, a Node.js app or a Python script on a server with `nohup ... &` works at first glance; but when the process crashes nobody restarts it, it doesn't come back after a reboot, and the logs end up scattered.

**systemd**, present on every modern Linux distribution (Ubuntu, Debian, AlmaLinux, RHEL), solves all of this without installing anything: it starts the process, restarts it on crash, runs it at boot, and collects its logs in `journald`.

## 1. Basic systemctl commands

```bash
sudo systemctl start myapp       # start
sudo systemctl stop myapp        # stop
sudo systemctl restart myapp     # restart
sudo systemctl reload myapp      # reload configuration (if supported)
sudo systemctl enable myapp      # start automatically at boot
sudo systemctl enable --now myapp    # enable + start
sudo systemctl disable myapp
systemctl status myapp           # state, PID, last log lines
systemctl is-active myapp
systemctl list-units --type=service --state=running
systemctl list-units --failed
```

## 2. A first unit file

Unit files for your own services go in `/etc/systemd/system/`. Here's a Spring Boot app:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Spring Boot App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/java -Xmx512m -jar /opt/myapp/app.jar
Restart=on-failure
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin myapp
sudo systemctl daemon-reload     # read the new/changed unit file
sudo systemctl enable --now myapp
systemctl status myapp
```

What the sections mean:

| Section | Purpose |
| --- | --- |
| `[Unit]` | Description and relationships to other units (`After`, `Wants`, `Requires`) |
| `[Service]` | How the process runs: command, user, restart policy |
| `[Install]` | Which target it hooks into when enabled; `multi-user.target` for servers |

`SuccessExitStatus=143` stops the 143 exit code Java returns on `SIGTERM` from counting as a failure.

> Run `systemctl daemon-reload` every time you change a unit file; otherwise systemd keeps using the old version.

## 3. Node.js and Python examples

```ini
# /etc/systemd/system/api.service
[Unit]
Description=Node.js API
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/api
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/worker.service
[Unit]
Description=Python worker
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/worker
ExecStart=/opt/worker/.venv/bin/python worker.py
Restart=on-failure
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

Without `PYTHONUNBUFFERED=1`, Python buffers its output and logs reach the journal late.

## 4. Environment variables and secrets

`Environment=` is fine for a few variables. For many variables, or values containing passwords, use a separate file:

```bash
# /etc/myapp/myapp.env  (chmod 600, owned by root)
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=s3cret
```

```ini
[Service]
EnvironmentFile=/etc/myapp/myapp.env
```

To check that the variables reach the service:

```bash
systemctl show myapp --property=Environment
sudo cat /proc/$(systemctl show -p MainPID --value myapp)/environ | tr '\0' '\n'
```

## 5. Restart policies

| `Restart=` | Restarts when |
| --- | --- |
| `no` | Never (default) |
| `on-failure` | Non-zero exit code, signal, timeout |
| `on-abnormal` | Signal or timeout (not exit codes) |
| `always` | On every exit, including clean ones |

To keep a constantly crashing service from looping forever:

```ini
[Unit]
StartLimitIntervalSec=60
StartLimitBurst=5
```

With more than 5 start attempts within 60 seconds, systemd marks the service `failed` and stops trying. Reset the counter with `systemctl reset-failed myapp`.

## 6. Logs with journalctl

The service's stdout/stderr goes to the journal automatically:

```bash
journalctl -u myapp                  # all logs
journalctl -u myapp -f               # follow
journalctl -u myapp -n 200           # last 200 lines
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp --since today
journalctl -u myapp --since "2026-10-30 09:00" --until "2026-10-30 10:00"
journalctl -u myapp -p err           # error and above only
journalctl -u myapp -b               # since the last boot
journalctl -u myapp -o cat           # plain output without timestamps
journalctl --disk-usage
sudo journalctl --vacuum-time=14d    # delete logs older than 14 days
```

To cap the journal's disk usage permanently, set `SystemMaxUse=500M` in `/etc/systemd/journald.conf` and run `sudo systemctl restart systemd-journald`.

## 7. Simple hardening

systemd lets you restrict a process with a few lines:

```ini
[Service]
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/myapp/data /var/log/myapp
```

`ProtectSystem=strict` makes the whole file system read-only; open up the folders the app needs to write with `ReadWritePaths`. Use `systemd-analyze security myapp` to see how well protected a service is.

## 8. Scheduled jobs with timers

systemd timers are an alternative to cron; logs land in the journal and missed runs can be caught up. A backup running every night at 02:00:

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Nightly database backup

[Service]
Type=oneshot
User=postgres
ExecStart=/usr/local/bin/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup nightly

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers
systemd-analyze calendar "*-*-* 02:00:00"   # next run time of the expression
```

`Persistent=true` runs the job right after boot if the server was off at 02:00.

## 9. Troubleshooting

| Situation | Where to look |
| --- | --- |
| `status=203/EXEC` | Wrong `ExecStart` path or the file isn't executable; use an absolute path |
| `status=217/USER` | The user given in `User=` doesn't exist |
| Changes have no effect | `systemctl daemon-reload` was forgotten |
| Works in a terminal, not as a service | Different `PATH` and environment; set `WorkingDirectory` and `Environment` |
| The service keeps restarting | Read the error with `journalctl -u myapp -n 100`; reset with `systemctl reset-failed` |
| Is the unit file valid? | `systemd-analyze verify /etc/systemd/system/myapp.service` |

## Conclusion

Writing a systemd service means a 10–15 line unit file. In return you get automatic restarts, start at boot, centralized logs and process isolation without installing anything else. Three commands to remember: `daemon-reload` after a change, `systemctl status` for the state, `journalctl -u` for the reason.
