---
layout: default
lang: de
permalink: /de
---

## Automatisiert einen Corona-Impftermin finden und reservieren

Die Corona-Impfung ist mittlweile für alle Personen ab 18 Jahren freigegeben, aber es ist nicht immer einfach einen Termin zu finden. Wenn Sie es satt haben permanent die Impfzentren oder die [Doctolib zu aktualisieren](https://twitter.com/marine_roussill/status/1393185768219287552) um einen Termin zu finden, dann ist diese [Firefox](https://www.mozilla.org/fr/firefox/new/) Extension genau das richtige für Sie!

_vaccin.click_ benachrichtigt oder reserviert für Sie automatisch sobald ein freier Termin bei den Impfzentren oder Ärzten Ihrer Wahl gefunden wurde!

[![Popup](screenshot.png)](screenshot.png)

### vaccin.click installieren

1. Wenn es nicht schon geschehen ist, installieren Sie [Firefox auf Ihrem Computer](https://www.mozilla.org/de/firefox/new/), ein freier und kostenloser Internet-Browser.
2. [Installieren Sie die Erweiterung _vaccin.click_](https://addons.mozilla.org/fr/firefox/addon/vaccin-click/)

**Sie sind nun bereit geimpft zu werden!**

### Anleitung

1. Klicken Sie auf das Icon in der Browserleiste in Form einer Impfdosis
2. Wählen Sie ob Sie benachrichtigt werden wollen (standard), wenn ein Termin gefunden wurde, oder ob _vaccin.click_ gleich für Sie reservieren soll. Falls _vaccin.click_ für Sie buchen soll, müssen Sie sich zuerst bei Doctolib anmelden, in diesem Fall wird für Sie automatisch der nächste freie Termin gebucht. Stellen Sie sicher, dass Sie diesen wahrnehmen können.
3. Klicken Sie auf `Impfzentren oder Ärzte auf Doctolib finden`
4. Die Doctolib Seite öffnet sich, benutzen Sie die Filter um die Impfzentren oder Ärzte in Ihrer Nähe zu finden.
5. Fügen Sie die Impfzentren oder Ärzte Ihrer Watchlist hinzu, indem Sie auf den Button `Zur Liste hinzufügen` klicken.

_vaccin.click_ wird nun automatisch die Termine im 3 Minuten Abstand in den ausgesuchten Praxen suchen.
Sobald ein Termin gefunden wurde bekommen Sie eine Browser Benachrichtigung und ein neuer Tab öffnet sich, in dem Sie Ihre Reservierung finalisieren können.

[![Notification](notification.png)](notification.png)

Wenn Sie den automatischen Modus aktiviert haben, werden Sie benachrichtigt und ein Tab öffnet sich, wenn der Termin erfolgreich gebucht wurde. Sie bekommen ebenfalls eine Benachrichtiungsmail von Doctolib. Wenn ein Problem bei der automatischen Reservierung auftritt, öffnet sich eine Seite um die Reservierung manuell zu finalisieren.

**Achtung : die Terminsuche funktioniert nur solange Firefox geöffnet und Ihr Computer eingeschaltet ist!**

Beenden Sie jederzeit die automatische Terminsuche indem Sie auf `Terminsuche pausieren` klicken.

Wenn ein Termin reserviert wurde, beendet die Erweiterung automatisch die weitere Terminsuche. Wenn Sie einen Termin ohne die Erweiterung gefunden haben, denken Sie daran die Erweiterung zu stoppen.

Desweiteren, sollten Sie den Termin doch nicht wahrnehmen können, denken Sie daran diesen über Doctolib zu stornieren.

## FAQ

### Welchen Impfstoff kann ich wählen ?

Die Erweiterung wählt Standardmäßig Pfizer-BioNTech, aber kann alternativ auch nach Moderna Impfstoffen suchen. Sie können das über die Erweiterungseinstellung ändern.

### Werden auch andere Seiten außer Doctolib unterstützt?

Im Moment nicht. Wenn Sie ein Entwickler sind, [können Sie contributen, um andere Seiten zu unterstützen](https://github.com/dunglas/vaccin.click).

### Werden andere Internet-Browser unterstützt?

Im Moment nicht (auch wenn die Extension unter Safari funktionieren sollte). Wenn Sie ein Entwickler sind, [können Sie contributen, um andere Internet-Browser zu unterstützen](https://github.com/dunglas/vaccin.click).

### Werden die Mobilversionen von Firefox unterstützt?

Im Moment nicht, die Android und iOS Versionen von Firefox sind nicht mit den Erweiterungen kompatibel. Wenn Sie ein Entwickler sind, [können Sie contributen, um andere Platformen zu unterstützen](https://github.com/dunglas/vaccin.click).

### Wie viel kostet es?

Die Erweiterung ist kostenlos. Es handelt sich um eine [Freie Software](https://de.wikipedia.org/wiki/Freie_Software) unter der AGPL Lizenz. Der [Source Code ist auf GitHub](https://github.com/dunglas/vaccin.click) zu finden.

Wenn Ihnen das Projekt gefällt, können Sie [eine Spende an das öffentlich Krankenhaus von Lille](https://www.chu-lille.fr/soutenez-le-chu-de-lille) machen, um eine Qualitativ gute Gesundheitsversorgung für alle sicherzustellen.

Wenn Sie mich bei der Entwicklung und dem Bugfixing unterstützen möchten, können Sie mich auf [GitHub sponsorn](https://github.com/sponsors/dunglas).

### Sammelt die Erweiterung meine Daten?

Nein (aber Doctolib und das Impfzentrum selbstversändlich). Die Erweiterung läuft lokal in Ihrem Browser auf Ihrem Rechner.

### Bei mir funktioniert es nicht!

Dieses Projekt ist ein nicht kommerzielles Produkt und wird ohne jegliche Garantie bereitgestellt. Der Code von Doctolib kann sich jederzeit ändern und manche Impfzentren haben Formulare die von der Erweiterung noch nicht unterstützt werden.

Um sicherzustellen, dass die Erweiterung korrekt ausgeführt wird, geben Sie `about:devtools-toolbox?id=extension%40vaccin.click&type=extension` in die Adressleiste ein.

Wenn sie funktioniert, erscheint auch eine Nachricht im Aktivitätsprotokoll die lautet: "Kein Termin verfügbar".
Wenn Sie diese Nachricht nicht sehen, können Sie [ein Ticket öffnen](https://github.com/dunglas/vaccin.click/issues) in dem Sie Ihr Problem beschreiben. Idealerweise fügen Sie dem die Fehlermeldung, sowie die URL des Impfzentrums/Praxis bei.

### Wer hat diese Erweiterung entwickelt?

Diese Erweiterung wurde von [Kévin Dunglas](https://dunglas.fr) ([Twitter](https://twitter.com/dunglas)) und Anne Lesouef entwickelt.

Die [Icons](https://www.iconfinder.com/icons/5959975/corona_drugs_injection_syringe_vaccine_icon) wurden von [E Conceptive](https://www.iconfinder.com/econceptive) erstellt (Creative Commons Attribution 3.0 Unported Lizenz).

Das Theme der Webseite wurde von [orderedlist](https://orderedlist.com) erstellt.
