# Contribuer à vaccin.click

Merci de regarder comment contribuer à vaccin.click !

Cette extension utilise node pour installer des dépendances utilisées pour le
développement. Ce fichier explique comment les installer et les utiliser.

## Installation de node

L'installation de node dépend de votre système. Vous pouvez l'installer
globalement sur votre système avec [les paquets disponibles sur leur
site](https://nodejs.org/fr/), ou bien, si vous voulez une gestion plus fine,
vous pouvez aussi utiliser un script comme [nvm](https://github.com/nvm-sh/nvm#about).

## Installation des dépendances

Lorsque `node` est installé, vous pouvez cloner le projet et installer les
dépendances:

```
git clone git@github.com:dunglas/vaccin.click.git
cd vaccin.click
npm i
```

## Scripts disponibles

Les scripts suivants sont disponibles:

- `npm run lint` va lancer prettier localement.
- `npm run lint-fix` également, tout en corrigeant les problèmes.
- `npm start` lance l'extension dans firefox, et la recharge à chaque
  changement.\
  On peut utiliser l'option `-f` pour spécifier la version de
  Firefox à lancer: `nightly`, `beta`, `firefoxdeveloperedition`, `firefox`, ou
  tout simplement un chemin complet:\
  `npm start -- -f nightly`\
  `npm start -- -f ~/firefox/firefox`\
  La variable d'environnement `$WEB_EXT_FIREFOX` permet de configurer cela de
  manière permanente.
- `npm run build` va builder localement l'extension.
- `npx web-ext lint` va linter l'extension.

## Trucs et astuces

(À compléter)
