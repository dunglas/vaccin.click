// Scan périodique des RDV
(async function () {
  const MAX_ACTIVITY = 30;
  const STATUS = {
    ERROR: "e",
    SUCCESS: "s",
    WORKING: "w",
  };
  const appStatus = new AppStatus();
  const jobs = new JobQueue(20, (job) => {
    setStatusOnLocation(job, STATUS.WORKING);
    addLocationActivity(appStatus.getLocation(job), "Début de la vérification");
  });

  appStatus.onLocationChange((url) => {
    jobs.add(url);
  }, (url) => {
    jobs.kill(url);
    jobs.remove(url);
  });

  appStatus.onStoppedChange((stoppedStatus) => {
    browser.browserAction.setIcon({
      path: {
        16: `../icons/vaccine-${stoppedStatus ? "black" : "color"}.svg`,
        32: `../icons/vaccine-${stoppedStatus ? "black" : "color"}.svg`,
      },
    });

    if (stoppedStatus) {
      jobs.stop();
    }
    else {
      jobs.start();
    }
  });

  function setStatusOnLocation(loc, status) {
    browser.storage.local.get({ locations: {} }).then((result) => {
      result.locations[loc] = {
        status: status,
        date: Date.now(),
      };
      browser.storage.local.set({ locations: result.locations });
    });
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
        addLocationActivity(data.location, "Succes - Créneau trouvé");
        break;

      case "booked":
        appStatus.stop();

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
      // Prévoir le job suivant
      jobs.add(data.url);
    }
  });

  // Récupérer le status initial de l'application
  await appStatus.init();

  // Executer les jobs toutes les TIME_BETWEEN_JOBS sec
  jobs.start();
})();
