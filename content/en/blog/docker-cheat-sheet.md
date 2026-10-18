---
title: "Docker Cheat Sheet"
description: "A Docker cheat sheet: images, containers, run flags, pruning, exec, networks, and common recipes."
date: 2019-09-17
tags: [docker]
translation: /blog/docker-cheat-sheet
---

## Docker Version and Info

```
docker -v
docker info
```

## List Images
`docker images`

## List Containers (running, all)

```
docker container ls
docker container ls --all
docker ps
docker ps -a
```

## Run a New Container

```
docker run <image-name>
docker run --name <name> <image-name>
docker run -p <outer-port>:<inner-port> <image-name>
docker run -d -p <outer-port>:<inner-port> <image-name>
```

## Start a Container
`docker start <name>`

## Stop a Container
`docker stop <name>`

## Remove a Container

```
docker rm <container-id>
docker rm -f <container-id>
```

## Remove an Image
`docker rmi <image-name>`

## Remove All Stopped Containers
`docker container prune`

## Remove All Unused Images
`docker image prune -a`

## Connect to Docker via Bash
`docker exec -it <name> bash`

**Install Docker**

`yum install docker`

**Start Docker Deamon**

`systemctl start docker`

**Create a Postgres Container**

`docker run -d --name my-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

**Create a Keycloak Server**

`docker run -d --name my-keycloak -e KEYCLOAK_USER=keyadmin -e KEYCLOAK_PASSWORD=keypass -p 7000:8080 jboss/keycloak`

**Create a Konga Admin GUI**

`docker run -d --name my-konga -p 1337:1337 -e "TOKEN_SECRET=somerandomstring" -e "DB_ADAPTER=postgres" -e "DB_HOST=kong-database" -e "DB_PORT=5432" -e "DB_USER=kong" -e "DB_PASSWORD=kong" -e "DB_DATABASE=konga" -e "NODE_ENV=development" --net=kong-net pantsel/konga`

**Create a Docker Network**

`docker network create --driver bridge kong-net`

**Connecting a Docker Container to a Network**

`docker network connect kong-net kong-database`

**Docker Compose Pull**

`docker-compose pull && docker-compose down && docker-compose up -d`
