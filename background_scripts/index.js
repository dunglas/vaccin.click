// Scan périodique des RDV
(async function () {
  let { locations, stopped } = await browser.storage.sync.get({
    locations: {},
    stopped: false,
  });

  // Détruit toutes les iframes actives
  function cleanupIframes() {
    document.querySelectorAll("iframe").forEach(($iframe) => $iframe.remove());
  }

  async function updateStatus(stopped) {
    await browser.alarms.clear();

    if (stopped) {
      cleanupIframes();

      await browser.browserAction.setIcon({
        path: {
          16: "../icons/vaccine-black.svg",
          32: "../icons/vaccine-black.svg",
        },
      });

      return;
    }

    browser.alarms.create({
      delayInMinutes: 0,
      periodInMinutes: 3,
    });
    await browser.browserAction.setIcon({
      path: {
        16: "../icons/vaccine-color.svg",
        32: "../icons/vaccine-color.svg",
      },
    });
  }

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName !== "sync") return;

    if (change.locations) locations = change.locations.newValue || {};

    if (change.stopped) {
      stopped = change.stopped.newValue;
      await updateStatus(stopped);
    }
  });

  browser.runtime.onMessage.addListener(async (data) => {
    console.info(data);
    document.getElementById(url).remove();

    switch (data.type) {
      case "found":
        await browser.tabs.create({
          url: data.url,
        });
        break;

      case "booked":
        await updateStatus(true);
        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
        });
        break;
    }
  });

  // On vérifie les dispos toutes les 3 minutes
  browser.alarms.onAlarm.addListener(async () => {
    cleanupIframes();

    for (const url of Object.keys(locations)) {
      // On patiente un peu entre chaque centre de vaccination pour ne pas trop stresser les serveurs
      await new Promise((r) =>
        setTimeout(r, 1000 + Math.floor(Math.random() * 5000))
      );

      if (stopped) return;

      console.info(`Crawling ${url}`);

      const iframe = document.createElement("iframe");
      // On charge l'URL dans une iframe
      // Ici on laisse la main au content script qui va vérifier si un RDV est disponible
      iframe.src = url;
      iframe.id = url;
      document.body.appendChild(iframe);
    }
  });

  await updateStatus(stopped);
})();
