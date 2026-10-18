---
title: "Docker Cheat Sheet"
description: "Docker cheat sheet: imajlar, container'lar, run flag'leri, prune, exec, network'ler ve sık kullanılan tarifler."
date: 2019-09-17
tags: [docker]
translation: /en/blog/docker-cheat-sheet
---

## Docker Versiyonu ve Bilgisi

```
docker -v
docker info
```

## İmajları Listele
`docker images`

## Container'ları Listele (çalışanlar, hepsi)

```
docker container ls
docker container ls --all
docker ps
docker ps -a
```

## Yeni Container Çalıştır

```
docker run <image-name>
docker run --name <name> <image-name>
docker run -p <outer-port>:<inner-port> <image-name>
docker run -d -p <outer-port>:<inner-port> <image-name>
```

## Container Başlat
`docker start <name>`

## Container Durdur
`docker stop <name>`

## Container Sil

```
docker rm <container-id>
docker rm -f <container-id>
```

## İmaj Sil
`docker rmi <image-name>`

## Durdurulmuş Tüm Container'ları Sil
`docker container prune`

## Kullanılmayan Tüm İmajları Sil
`docker image prune -a`

## Bash ile Docker'a Bağlan
`docker exec -it <name> bash`

**Docker'ı Kur**

`yum install docker`

**Docker Daemon'unu Başlat**

`systemctl start docker`

**Postgres Container Oluştur**

`docker run -d --name my-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

**Keycloak Sunucusu Oluştur**

`docker run -d --name my-keycloak -e KEYCLOAK_USER=keyadmin -e KEYCLOAK_PASSWORD=keypass -p 7000:8080 jboss/keycloak`

**Konga Admin GUI Oluştur**

`docker run -d --name my-konga -p 1337:1337 -e "TOKEN_SECRET=somerandomstring" -e "DB_ADAPTER=postgres" -e "DB_HOST=kong-database" -e "DB_PORT=5432" -e "DB_USER=kong" -e "DB_PASSWORD=kong" -e "DB_DATABASE=konga" -e "NODE_ENV=development" --net=kong-net pantsel/konga`

**Docker Network Oluştur**

`docker network create --driver bridge kong-net`

**Docker Container'ı Network'e Bağla**

`docker network connect kong-net kong-database`

**Docker Compose Pull**

`docker-compose pull && docker-compose down && docker-compose up -d`
