// Scan périodique des RDV
(async function () {
  const MAX_ACTIVITY = 30;
  const TIME_BETWEEN_JOBS = 20;
  const iframes = {};
  const jobs = [];
  const STATUS = {
    ERROR: "e",
    SUCCESS: "s",
    WORKING: "w",
  };

  async function updateIconStatus(stopped) {
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

    document.body.appendChild($iframe);

    return $iframe;
  }

  async function setStatusOnLocation(loc, status) {
    const { locations } = await browser.storage.local.get({ locations: {} });
    locations[loc] = {
      status: status,
      date: Date.now(),
    };
    await browser.storage.local.set({ locations });
  }

  async function addActivity(message) {
    const { activities } = await browser.storage.local.get({ activities: [] });

    activities.push(new Date().toLocaleTimeString() + " - " + message);

    while (activities.length > MAX_ACTIVITY) {
      activities.shift();
    }

    await browser.storage.local.set({ activities: activities });
  }

  async function addLocationActivity(location, message) {
    return addActivity(location.name + " - " + message);
  }

  async function executeNextJob() {
    const { stopped } = await browser.storage.local.get({
      stopped: false,
    });

    if (stopped) return;

    const job = jobs.shift();
    if (job) {
      setStatusOnLocation(job, STATUS.WORKING);
      addLocationActivity(locations[job], "Début de la vérification");

      if (iframes.hasOwnProperty(job))
        // Recharger l'iframe existante
        iframes[job].contentWindow.postMessage(
          {
            type: "retry",
          },
          "*"
        );
      // Créer une nouvelle iframe
      else iframes[job] = createIframe(job);
    }
  }

  function killJob(url, deleteIframe) {
    // Supprimer l'iframe si elle existe
    if (deleteIframe === true && iframes.hasOwnProperty(url)) {
      iframes[url].remove();
      delete iframes[url];
    }

    // Supprime le job si il existe
    while (jobs.includes(url)) jobs.splice(jobs.indexOf(url), 1);
  }

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName === "sync" && change.locations && change.locations.newValue) {
      Object.keys(locations).forEach((url) => {
        if (!change.locations.newValue[url]) {
          delete locations[url];
          killJob(url, true);
        }
      });

      Object.keys(change.locations.newValue).forEach((url) => {
        if (!locations[url]) locations[url] = change.locations.newValue[url];

        // Si je job n'est pas déjà en attente ou en cours de traitement
        if (!jobs.includes(url) && !iframes[url]) jobs.push(url);
      });
    }

    if (change.stopped) {
      await updateIconStatus(change.stopped.newValue);
      if (areaName === "sync") {
        // Ça peut arriver de cette instance ou d'une autre instance de Firefox
        // -> mettons aussi à jour la valeur locale pour arrêter les checks locaux.
        await browser.storage.local.set({ stopped: true });
      }
    }
  });

  browser.runtime.onMessage.addListener(async (data) => {
    console.info(data);

    switch (data.type) {
      case "error":
        setStatusOnLocation(data.url, STATUS.ERROR);
        addLocationActivity(data.location, "Echec - " + data.error.message);
        break;

      case "found":
        const tabs = await browser.tabs.query({ url: data.url });

        // Ne pas réouvrir l'onglet si il est déjà ouvert
        if (0 !== tabs.length) break;

        await browser.tabs.create({ url: data.url });

        await browser.notifications.create(data.url, {
          type: "basic",
          iconUrl: browser.extension.getURL("icons/vaccine-color.svg"),
          title: "Un créneau de vaccination est disponible !",
          message: `Cliquez ici pour finaliser la réservation dans le centre "${data.location.name}"`,
          priority: 2,
        });

        setStatusOnLocation(data.url, STATUS.SUCCESS);
        addLocationActivity(data.location, "Succès - Créneau trouvé");
        break;

      case "booked":
        // Note: on met à jour la valeur locale dans onChanged au-dessus.
        await browser.storage.sync.set({ stopped: true });

        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
        });
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.extension.getURL("icons/vaccine-color.svg"),
          title: "Votre créneau de vaccination a été réservé !",
          message: `Vous avez rendez-vous au centre "${data.location.name}".`,
        });

        setStatusOnLocation(data.url, STATUS.SUCCESS);
        addLocationActivity(data.location, "Succes - Créneau réservé");
        break;
    }

    if (["error", "found", "booked"].includes(data.type)) {
      // Nettoyer le job précédent
      killJob(data.url);

      // Prévoir le job suivant
      jobs.push(data.url);
    }
  });

  // Le booléan "stopped" est à la fois stocké localement et synchronisé. En
  // effet, lorsqu'on arrive à booker un rdv dans un Firefox on veut arrêter les
  // checks dans toutes les instances. Mais un simple clic sur le bouton ne doit
  // déclencher d'arrêt que localement.
  const { locations, stopped: stoppedFromSync } =
    await browser.storage.sync.get({
      locations: {},
      stopped: false,
    });

  const { stopped } = await browser.storage.local.get({
    stopped: stoppedFromSync,
  });

  await updateIconStatus(stopped);

  // On ajoute les iframes pour charger les centres à surveiller en arrière plan
  Array.prototype.push.apply(jobs, Object.keys(locations));

  // Executer les jobs toutes les TIME_BETWEEN_JOBS sec
  setInterval(executeNextJob, TIME_BETWEEN_JOBS * 1000);
  executeNextJob();
})();
