---
title: "Creating an SSH Key Pair"
description: "Creating an SSH key pair with ssh-keygen and setting up passwordless server access."
date: 2019-06-26
tags: [application servers]
translation: /blog/create-ssh-key-pair
---

For security, I prefer creating an SSH key pair and sharing the "Public Key" over using a "username"/"password" for most of the places I connect to.
In this post I'll walk through creating a key pair on **Mac OS** in detail.

## What Is an SSH Key Pair? (Secure Shell Key Pair)

Secure Shell is a cryptographic network protocol that enables secure communication over an insecure network.
Since my goal here is to create a private-public key pair, I'll generate an RSA key pair using "asymmetric encryption". Below you can see the features of the **ssh-keygen** tool.
![](/images/create-ssh-key-pair-Screenshot-2019-06-26-at-18.10.14.png)

1. I'll run the following command in the terminal. It will help me generate an RSA key pair.
  `ssh-keygen -t rsa`

2. It will ask which file to save the key to — you can give it any name you like.

3. After this step, you can optionally set a passphrase for using the keys.

4. The output will look like the one below. Two keys were created: one private and one public. You must never share the private one with anyone.

5. Take the key from inside the public one (the file ending in .pub) and you can now share it.![](/images/create-ssh-key-pair-Screenshot-2019-06-26-at-19.33.20.png)

Take it easy.
