---
title: Frequently Used PM2 Commands
description: "The most-used commands of PM2, the process manager that keeps Node.js apps alive in production — starting, monitoring, logs, cluster mode, the ecosystem file and startup on boot."
date: 2026-10-24
tags: [pm2, nodejs, guide]
translation: /blog/frequently-used-pm2-commands
---

## Introduction

[PM2](https://pm2.keymetrics.io/) is a process manager for Node.js applications. It runs your app in the background, restarts it when it crashes, collects its logs, spreads it across multiple CPU cores and brings your apps back when the server reboots. It isn't limited to Node.js either — it can manage Python, Bash or any other executable.

This post collects the PM2 commands you need most in day-to-day work, in order of use. The examples use `api` as the app name; in any command you can use the **id** from `pm2 list` instead of the name, or `all` for every app.

## 1. Installation

PM2 is installed globally:

```bash
npm install -g pm2
pm2 --version
```

After upgrading PM2, run `pm2 update` so the background daemon switches to the new version too; running apps are saved and brought back up.

```bash
npm install -g pm2@latest
pm2 update
```

## 2. Starting apps

```bash
pm2 start app.js                       # the simplest form
pm2 start app.js --name api            # give it a meaningful name
pm2 start app.js --watch               # restart on file changes (for development)
pm2 start app.js --max-memory-restart 300M   # restart when memory limit is exceeded
pm2 start app.js --cron-restart="0 3 * * *"  # restart every night at 03:00
pm2 start app.js --node-args="--max-old-space-size=4096"
pm2 start app.js -- --port 8080        # everything after "--" is passed to the app
```

You can also run an npm script, another language or an arbitrary command:

```bash
pm2 start npm --name web -- start          # runs "npm start"
pm2 start "npm run start" --name web       # same thing, command in quotes
pm2 start worker.py --interpreter python3  # Python script
pm2 start backup.sh --no-autorestart       # run once and exit
```

## 3. Listing and monitoring

```bash
pm2 list               # all processes (aliases: pm2 ls, pm2 status)
pm2 show api           # single-process details: log paths, restart count, env, uptime
pm2 monit              # live CPU/memory and log dashboard in the terminal
pm2 jlist              # the list as JSON (for scripts)
```

The **↺** column in `pm2 list` shows the restart count. If it keeps growing, the app is crashing and being restarted; check the logs for the cause.

## 4. Stopping, restarting, deleting

```bash
pm2 stop api           # stop (stays in the list)
pm2 restart api        # stop + start
pm2 reload api         # zero-downtime reload (in cluster mode)
pm2 delete api         # stop and remove from the list

pm2 restart all
pm2 stop all
pm2 delete all
```

| Command | What it does | When |
| --- | --- | --- |
| `restart` | Kills and restarts the process, with a brief downtime | Fork mode, config changes |
| `reload` | Replaces instances one by one, at least one stays up | After a deploy in cluster mode |
| `stop` | Stops the process, keeps its settings in the list | Shutting it down temporarily |
| `delete` | Stops the process and removes it from the list | Removing the app |

## 5. Logs

By default PM2 writes each app's `stdout` and `stderr` under `~/.pm2/logs/`.

```bash
pm2 logs               # live logs of all apps
pm2 logs api           # only api
pm2 logs api --lines 200   # last 200 lines, then live stream
pm2 logs api --err     # error output only
pm2 logs --nostream    # print recent lines and exit
pm2 flush              # empty all log files
pm2 flush api          # empty only api's logs
```

Logs can fill up the disk over time; the `pm2-logrotate` module rotates files by size and deletes old ones:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M     # rotate when a file reaches 10 MB
pm2 set pm2-logrotate:retain 7         # keep the last 7 files
pm2 set pm2-logrotate:compress true    # gzip old files
```

## 6. Cluster mode and scaling

Node.js runs on a single core. Cluster mode runs multiple copies of your app on the same port and spreads the load across cores — no code changes needed.

```bash
pm2 start app.js -i max --name api     # one instance per CPU core
pm2 start app.js -i 4 --name api       # 4 instances
pm2 scale api 2                        # set the instance count to 2
pm2 scale api +2                       # add 2 more instances
pm2 reload api                         # reload with zero downtime
```

> Cluster mode requires your app to be **stateless**: keep sessions, caches and similar data in Redis or a database, not in memory.

## 7. The ecosystem file

As command-line options pile up, it's cleaner to put them all in a config file. To generate a sample file:

```bash
pm2 init simple        # creates ecosystem.config.js
```

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
    {
      name: 'worker',
      script: './dist/worker.js',
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js                      # start all apps (env)
pm2 start ecosystem.config.js --env production     # with env_production variables
pm2 start ecosystem.config.js --only api           # only api
pm2 reload ecosystem.config.js --env production    # zero-downtime reload after a deploy
```

Commit this file to Git with the project, and how the app is run gets versioned along with the code.

## 8. Environment variables

PM2 stores the environment variables from when the app was first started. After changing a variable, a plain `restart` isn't enough; add `--update-env`:

```bash
NODE_ENV=production pm2 restart api --update-env
pm2 env 0              # show the env of the process with id 0
```

## 9. Starting on boot

Two steps are needed for your apps to come back after a server reboot:

```bash
pm2 startup            # detects the init system (systemd etc.) and prints a sudo command to run
# run the printed "sudo env PATH=... pm2 startup systemd -u user --hp /home/user" command

pm2 save               # save the current process list to ~/.pm2/dump.pm2
```

On boot, PM2 restores this saved list. Don't forget to run `pm2 save` again after adding or removing apps.

```bash
pm2 resurrect          # restore the saved list manually
pm2 unstartup systemd  # remove the startup hook
```

> If you installed Node.js with nvm and switched versions, repeat `pm2 unstartup` + `pm2 startup`; the startup script may still point to the old Node path.

## 10. Maintenance and troubleshooting

```bash
pm2 reset api          # reset metrics such as the restart counter
pm2 describe api       # same as pm2 show
pm2 ping               # is the daemon alive?
pm2 kill               # stop the daemon and all processes
```

Common situations:

| Situation | Fix |
| --- | --- |
| App keeps restarting (↺ growing) | Find the error with `pm2 logs api --err --lines 100` |
| New env variable doesn't reach the app | `pm2 restart api --update-env` |
| Apps are gone after a reboot | Run the command printed by `pm2 startup`, then `pm2 save` |
| Disk filled up with logs | `pm2 flush` + install `pm2-logrotate` |
| "In-memory PM2 is out-of-date" warning after an upgrade | `pm2 update` |

## Conclusion

Most day-to-day PM2 work comes down to `start`, `list`, `logs`, `restart`/`reload` and `save`. When going to production, remember three things: keep your settings in an **ecosystem file**, set up startup on boot with **`pm2 startup` + `pm2 save`**, and use **`pm2-logrotate`** to keep logs from filling the disk.
