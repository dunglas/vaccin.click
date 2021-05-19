// Scan périodique des RDV
(async function () {
  async function updateIconStatus() {
    return await browser.browserAction.setIcon({
      path: {
        16: `../icons/vaccine-${stopped ? "black" : "color"}.svg`,
        32: `../icons/vaccine-${stopped ? "black" : "color"}.svg`,
      },
    });
  }

  function createIframe(url) {
    const $iframe = document.createElement("iframe");
    // On charge l'URL dans une iframe
    // Ici on laisse la main au content script qui va vérifier si un RDV est disponible
    $iframe.src = url;
    $iframe.id = url;
    document.body.appendChild($iframe);
  }

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName !== "sync") return;

    if (change.locations && change.locations.newValue) {
      const existingIframes = [];
      document.querySelectorAll("iframe").forEach(($iframe) => {
        if (!change.locations.newValue[$iframe.id]) {
          $iframe.remove();

          return;
        }

        existingIframes.push($iframe.id);
      });

      Object.keys(change.locations.newValue).forEach((url) => {
        if (!existingIframes.includes(url)) createIframe(url);
      });
    }

    if (change.stopped) return await updateIconStatus(stopped);
  });

  browser.runtime.onMessage.addListener(async (data) => {
    console.info(data);

    switch (data.type) {
      case "found": {
        const tabs = await browser.tabs.query({ url: data.url });

        // Ne pas réouvrir l'onglet si il est déjà ouvert
        if (0 !== tabs.length) break;

        await browser.tabs.create({ url: data.url });

        await browser.notifications.create(data.url, {
          type: "basic",
          iconUrl: browser.extension.getURL("icons/vaccine-color.svg"),
          title: "Un créneau de vaccination est disponible !",
          message: `Cliquez ici pour finaliser la réservation dans le centre "${data.name}"`,
          priority: 2,
        });
        break;
      }

      case "booked":
        await browser.storage.sync.set({ stopped: true });

        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
        });
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.extension.getURL("icons/vaccine-color.svg"),
          title: "Votre créneau de vaccination a été réservé !",
          message: `Vous avez rendez-vous au centre "${data.name}".`,
        });

        break;
    }
  });

  const { locations, stopped } = await browser.storage.sync.get({
    locations: {},
    stopped: false,
  });

  await updateIconStatus(stopped);

  // On ajoute les iframes pour charger les centres à surveiller en arrière plan
  Object.keys(locations).forEach((url) => createIframe(url));
})();
