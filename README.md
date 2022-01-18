# Web Push Notification Getting Started

*Notifications API is used to configure and display desktop/mobile notifications*

![](https://i.imgur.com/7YKsiVH.png)

> &copy; [Julien Noyer](https://www.linkedin.com/in/julien-n-21219b28/) - All rights reserved for educational purposes only

---

## Introduction

Les push notifications, ou notifications push, sont des messages d’alerte envoyés par des applications sur les téléphones mobiles et les ordinateurs. À l’origine, le terme désignait les messages sonores que l’on pouvait recevoir sur son smartphone avertissant de l’arrivée d’un nouveau mail. L’utilisation de push notification s’est répandu à d’autres applications mobiles comme les réseaux sociaux ainsi qu’au format web.

> En savoir plus https://mzl.la/3KkO6w0

<br>

## Utlisation de ce répertoire

Le projet développé dans ce répertoire met en place les principes de [Notification Push](https://mzl.la/3KkO6w0) et de [WebSocket](https://mzl.la/3rrwLsz) dans un serveur [Node.js](https://nodejs.org/en/) qui enregistre les informations de souscription dans un fichier [JSON](https://bit.ly/3fCdcbu) avec le module [JSON Server](https://bit.ly/3GULsv3). Le choix à été fait d'utiliser un système simple pour le stockage des informations, mais il vous faut néamoins installer [JSON Server](https://bit.ly/3GULsv3) ainsi que [Nodemon](https://bit.ly/3qE49gF) et les modules [Node.js](https://nodejs.org/en/) : 

```
npm install -g json-server &&
npm install -g nodemon &&
npm i
```

> Si vous avez déjà installé [JSON Server](https://bit.ly/3GULsv3) et [Nodemon](https://bit.ly/3qE49gF) `npm i` est suffisant

<br>

Une fois tous les modules installés, vous devez créer un fichier `.env` à la racine de votre répertoire local pour y indiquer les valeurs des différentes variables d'environnement nécessaires pour le fonctionnement de l'API : 

```
# Serveur
PORT=...
API_URL=...
JSON_SERVER_URL=...

# Notification
PUBLIC_KEY=...
PRIVATE_KEY=...
```

> Pour connaître vos cléfs public et privée, utiliser la méthode `webpush.generateVAPIDKeys()`.


<br>

Pour fonctionner, l'API à besoin d'avoir accès au serveur [JSON Server](https://bit.ly/3GULsv3) qui permet de manipuler le fichier `db.json` présent dans le dossier `data`, c'est pourquoi il faut dans un premier temps lancer la serveur avec la commande : 

```
npm run db
```

<br>

Pour ensuite lancer l'API avec la commande : 

```
node server.js
```

> Su vous souhaitez utiliser [Nodemon](https://bit.ly/3qE49gF), tapez la commande `npm start`.