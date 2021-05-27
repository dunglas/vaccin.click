# Contribuer à vaccin.click

Merci de regarder comment contribuer à vaccin.click !

Cette extension utilise node pour exécuter un ensemble de scripts utiles au
développement. Ce fichier explique comment les utiliser.

## Installation de node

L'installation de node dépend de votre système. Vous pouvez l'installer
globalement sur votre système avec [les paquets disponibles sur leur
site](https://nodejs.org/fr/), ou bien (recommandé), si vous voulez une gestion plus fine,
vous pouvez aussi utiliser un script comme [nvm](https://github.com/nvm-sh/nvm#about).

## Installation des dépendances

Lorsque `node` est installé, vous pouvez cloner le projet:

```
git clone git@github.com:dunglas/vaccin.click.git
cd vaccin.click
```

## Scripts disponibles

Les scripts suivants sont utiles:

- `npx prettier -w .` va lancer prettier localement et corriger les problèmes éventuels.
- `npx web-ext run` lance l'extension dans firefox, et la recharge à chaque
  changement.\
  On peut utiliser l'option `-f` pour spécifier la version de
  Firefox à lancer: `nightly`, `beta`, `firefoxdeveloperedition`, `firefox`, ou
  tout simplement un chemin complet:\
  `npx web-ext -f nightly`\
  `npx web-ext -f ~/firefox/firefox`\
  La variable d'environnement `$WEB_EXT_FIREFOX` permet de configurer cela de
  manière permanente.
- `npx web-ext build` va builder localement l'extension.
- `npx web-ext lint` va linter l'extension.

`web-ext` étant un peu long à installer à chaque fois, il est possible de
l'installer de manière globale avec:
`npm i web-ext --global`
Si vous utilisez `nvm` le programme installé sera dans votre `PATH`
automatiquement.

## Trucs et astuces

(À compléter)
