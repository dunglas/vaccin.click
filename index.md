## Trouvez et réservez automatiquement votre créneau de vaccination COVID-19

La vaccination contre le COVID-19 est désormais ouverte à toutes les personnes majeures, mais si vous n'êtes pas prioritaire il faut trouver un créneau dans les 24 heures et il y en a très peu. Si vous en avez marre [d'actualiser frénétiquement Doctolib](https://twitter.com/marine_roussill/status/1393185768219287552) pour trouver un RDV, cette extension pour [Firefox](https://www.mozilla.org/fr/firefox/new/) est faite pour vous !

*vaccin.click* vous permet de lister les centres de vaccination dans lesquels vous pouvez vous rendre et de réserver automatiquement dès qu'un créneau est disponible dans les 24 heures !

![Capture d'écran](screenshot.png)

Firefox est navigateur libre, gratuit et respectueux de votre vie privée.

### Installer vaccin.click

**Procédure temporaire** : la [vérification de l'extension](https://support.mozilla.org/fr/kb/signature-modules-complementaires-firefox) par l'équipe de Firefox est en cours. Quand elle sera terminée, l'extension sera installable en 1 click depuis Firefox.

En attendant, vous pouvez suivre la procédure temporaire suivante pour utiliser quand même l'extension :

1. [Téléchargez et installez la version Extended Support Release (ESR) de Firefox](https://www.mozilla.org/fr/firefox/enterprise/#download) (le deuxième item de la liste déroulante, cette version permet d'installer des extensions non signées). Il est aussi possible d'utiliser la [Firefox Developer Edition](https://www.mozilla.org/fr/firefox/developer/) plutôt que la version ESR.
2. Tapez `about:config` dans la barre d'URL du navigateur
3. Appuyez sur le bouton `Accepter le risque et poursuivre`
4. Cherchez `xpinstall.signatures.required` et passez cette préférence à `false` pour désactiver la vérification des extensions
5. [Téléchargez l'extension *vaccin.click*](vaccin.click-1.0.zip)
6. Ouvrez le menu de Firefox (l'icône avec trois barres horizontales sur la droite) et cliquez sur `Modules complémentaires`
7. Cliquez sur la roue crantée et choisissez `Installer un module depuis un fichier...`
8. Sélectionnez le fichier `vaccin.click-1.0.zip` que vous avez téléchargé précédemment et cliquez sur `Ajouter` !

**Vous êtes prêt à être vacciné !**

### Comment ça marche ?

1. Cliquez sur l'icône représentant un vaccin qui est apparue dans la barre d'outils
2. Choisissez si vous voulez que la page du centre de vaccination s'ouvre quand un créneau est disponible (par défaut), ou si vous souhaitez que *vaccin.click* prenne le rendez-vous pour vous automatiquement (pour utiliser cette fonctionnalité, il faut que vous soyez connecté à Doctolib, dans ce cas l'extension prendra automatiquement le premier RDV disponible pour la 1ère et la 2nde dose - soyez sûr d'être disponible !).
3. Cliquez sur `Trouver des centres de vaccination sur Doctolib`
4. Doctolib s'ouvre, utilisez les filtres pour trouver les centres de vaccination près de chez vous
5. Ajoutez des centres à votre liste à surveiller en appuyant sur le bouton `Ajouter à ma liste` ajouté par l'extension

**Attention : la vérification périodique ne fonctionne que quand votre navigateur et votre ordinateur sont ouverts !**

A tout moment, arrêtez la surveillance en cliquant sur `Mettre en pause la surveillance des RDV`.

Quand un RDV est réservé, l'extension arrête automatiquement la surveillance. Si vous avez trouvé un RDV sans utiliser l'extension, pensez à la désinstaller !

De même, si vous avez un empêchement, n'oubliez pas d'annuler le RDV depuis l'interface de Doctolib.

## Foire Aux Questions

### Quel vaccin est choisi ?

L'extension choisi un vaccin Pfizer ou Moderna (en fonction des disponibilités), seuls éligibles pour la population générale.

### Est-ce que les autres sites que Doctolib sont supportés ?

Pas pour l'instant. Si vous êtes un développeur, [vous pouvez contribuer pour ajouter le support d'autres sites](https://github.com/dunglas/vaccin.click).

### Est-ce que les autres navigateurs web sont supportés ?

Pas pour l'instant (même si l'extension devrait fonctionner aussi avec Safari). Si vous êtes un développeur, [vous pouvez contribuer pour ajouter le support d'autres navigateurs](https://github.com/dunglas/vaccin.click).

### Combien ça coûte ?

L'extension est entièrement gratuite. C'est [un logiciel libre](https://fr.wikipedia.org/wiki/Logiciel_libre) sous licence AGPL dont vous pouvez [trouver le code source sur GitHub](https://github.com/dunglas/vaccin.click).

Si le projet vous plaît, n'hésitez pas à [faire un don à l'hôpital public](https://www.chu-lille.fr/soutenez-le-chu-de-lille) pour assurer un service de santé de qualité à toutes et tous (et peut-être qu'un jour il ne sera plus nécessaire de confier nos données de santé à des entités privées pour se faire vacciner...).

Si vous souhaitez m'accorder du temps pour corriger les bugs et ajouter de nouvelles fonctionnalités (support d'autres sites, d'autres navigateurs...), vous pouvez me [sponsoriser sur GitHub](https://github.com/sponsors/dunglas).

### Mes données sont-elles collectées par l'extension ?

Non (mais elles le sont par Doctolib et le centre de vaccination bien entendu). L'extension fonctionne entièrement en local sur votre propre ordinateur.

### Chez moi ça marche pas !

Cette extension est un projet non-commercial et est fournie sans aucune garantie. Le code de Doctolib peut changer, et certains centres de vaccination ont des formulaires particuliers qui ne sont pas encore supportés par l'extension.

Si ça ne fonctionne pas chez vous, n'hésitez pas à [ouvrir un ticket](https://github.com/dunglas/vaccin.click/issues) en indiquant précisément quel est le problème que vous rencontrez et quelle est l'URL du centre de vaccination pour lequel l'extension ne fonctionne pas.

### Qui a créé cette extension ?

Cette extension a été créee par [Kévin Dunglas](https://dunglas.fr). [Me suivre sur Twitter](https://twitter.com/dunglas).

Les [icônes](https://www.iconfinder.com/icons/5959975/corona_drugs_injection_syringe_vaccine_icon) ont été réalisées par [E Conceptive](https://www.iconfinder.com/econceptive) (licence Creative Commons Attribution 3.0 Unported).

Le thème du site web a été réalisé par [orderedlist](https://orderedlist.com).
