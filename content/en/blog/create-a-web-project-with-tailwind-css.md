---
title: "Create a web project with Tailwind CSS"
description: "Setting up a web project with Tailwind CSS: project init, config paths, directives, and building the CSS."
date: 2022-12-18
tags: [application servers]
---

## Project folder and Node.js activation

```
mkdir tailwind-demo
cd tailwind-demo
npm init
```

## Install Tailwind CSS

```
npm install -D tailwindcss
npx tailwindcss init
```

You will have dev dependency for tailwind and tailwind.config.css

## Configure path

Change content element like below to dedicate the directory.

```
content: ["./src/**/*.{html,js}"],
```

## Add Tailwind directives

Create src folder and input.css file. You will have src/input.css, then add below lines.

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Tailwind CSS Watch Tool into package.json

Add this watch script into your package.json scripts section. We will start our project with this command later.

```
"watch": "npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch"
```

## Create a HTML page for testing purpose

Under src folder create an index.html file, then add below lines.

```
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/dist/output.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

## Start your project

```
npm run watch
```

Open index.html file in your browser by using LiveServer or another testing tool. You will see the page with Tailwind support. Enjoy.

```
http://127.0.0.1:5500/src/index.html
```
