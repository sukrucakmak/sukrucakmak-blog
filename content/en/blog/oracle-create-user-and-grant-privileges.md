---
title: "Creating a User and Granting Privileges in Oracle"
description: "Commands for creating a new user and granting privileges in Oracle."
date: 2017-08-08
tags: [oracle]
translation: /blog/oracle-create-user-and-grant-privileges
---

Hello, the commands needed to create a user on Oracle DB can be as follows. I'm assuming we're connected with a privileged user. I've set the username as SUKRU.
To define the user:

```sql
CREATE USER SUKRU IDENTIFIED BY SUKRU
```
To grant the right to connect:

```sql
GRANT CREATE SESSION TO SUKRU
```
To grant the right to create tables:

```sql
GRANT CREATE TABLE TO SUKRU
```
To grant the right to create sequences:

```sql
GRANT CREATE SEQUENCE TO SUKRU
```
To allow using tablespace:

```sql
GRANT UNLIMITED TABLESPACE TO SUKRU
```
In current Oracle versions no privileges are needed for SELECT, INSERT, UPDATE, DELETE — but if required:

```sql
GRANT

  SELECT,

  INSERT,

  UPDATE,

  DELETE

ON

  schema.table

TO

  SUKRU
```
