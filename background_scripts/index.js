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
      case "found":
        await browser.tabs.create({
          url: data.url,
        });
        break;

      case "booked":
        await updateIconStatus(true);
        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
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
