// Scan périodique des RDV
(async function () {
  const MAX_ACTIVITY = 30;
  const TIME_BETWEEN_JOBS = 20;
  const iframes = {};
  const jobs = [];

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

    document.body.appendChild($iframe);
    
    return $iframe;
  }

  async function addActivity(message) {
    const { activities } = await browser.storage.local.get({ activities: [] });

    activities.push((new Date()).toLocaleTimeString() + ' - ' + message);

    while (activities.length > MAX_ACTIVITY) {
      activities.shift();
    }

    await browser.storage.local.set({ activities: activities });
  }

  async function addLocationActivity(location, message) {
    return addActivity(location.name + ' - ' + message);
  }


  async function executeNextJob() {
    const { stopped } = await browser.storage.sync.get({
      stopped: false
    });

    if (stopped) {
      return;
    }

    const job = jobs.shift();
    if (job) {
      addLocationActivity(locations[job], 'Début de la vérification');
      
      iframes[job] = createIframe(job);
    }
  }

  function killJob(url) {
    // Supprimer l'iframe si elle existe
    if (iframes.hasOwnProperty(url)) {
      iframes[url].remove();
      delete iframes[url];
    }

    // Supprime le job si il existe
    while(jobs.indexOf(url) >= 0) {
      jobs.splice(jobs.indexOf(url), 1);
    }
  }

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName !== "sync") return;

    if (change.locations && change.locations.newValue) {
      // Suppression des jobs expirés
      Object.keys(iframes).forEach((url) => {
        if (!change.locations.newValue[url]) {
          killJob(url);
        }
      });

      // Creation des nouvelles iframs si besoin
      Object.keys(change.locations.newValue).forEach((url) => {
        if (!iframes[url]) {
          jobs.push(url);
        }
      });
    }

    if (change.stopped) return await updateIconStatus(stopped);
  });

  browser.runtime.onMessage.addListener(async (data) => {
    console.info(data);

    switch (data.type) {
      case "over":
        // Nettoyer le job précédent
        killJob(data.url);
        
        // Prévoir le job suivant
        jobs.push(data.url);
        break;

      case "error":
        addLocationActivity(data.location, 'Erreur - ' + data.error.message);
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

        addLocationActivity(data.location, 'Succes - Créneau trouvé');
        break;

      case "booked":
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

        addLocationActivity(data.location, 'Succes - Créneau réservé');
        break;
    }
  });

  const { locations, stopped } = await browser.storage.sync.get({
    locations: {},
    stopped: false,
  });

  await updateIconStatus(stopped);

  // On ajoute les iframes pour charger les centres à surveiller en arrière plan
  Array.prototype.push.apply(jobs, Object.keys(locations));

  // Execute jobs every TIME_BETWEEN_JOBS sec
  setInterval(executeNextJob, TIME_BETWEEN_JOBS * 1000);
  executeNextJob();
})();
