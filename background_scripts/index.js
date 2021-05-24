// Scan périodique des RDV
(async function () {
  const appStatus = new AppStatus();
  const localStorage = new LocalStorage(30);
  const jobs = new JobQueue(10, 45, (job) => {
    localStorage.setLocationStatus(job, LocationCheckStatus.WORKING);
    localStorage.locationLog(
      appStatus.getLocation(job),
      "Début de la vérification"
    );
  });

  appStatus.onLocationChange(
    (url) => {
      jobs.add(url);
    },
    (url) => {
      jobs.kill(url);
      jobs.remove(url);
    }
  );

  appStatus.onStoppedChange((stoppedStatus) => {
    browser.browserAction.setIcon({
      path: {
        16: `../icons/vaccine-${stoppedStatus ? "black" : "color"}.svg`,
        32: `../icons/vaccine-${stoppedStatus ? "black" : "color"}.svg`,
      },
    });

    stoppedStatus ? jobs.stop() : jobs.start();
  });

  browser.runtime.onMessage.addListener(async (data) => {
    console.info(data);

    switch (data.type) {
      case "error":
        localStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.ERROR,
          data.error.message
        );
        localStorage.locationLog(
          data.location,
          "Echec - " + data.error.message
        );
        break;

      case "found":
        localStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.SUCCESS,
          "Créneau trouvé"
        );
        localStorage.locationLog(data.location, "Succes - Créneau trouvé");

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
        break;

      case "booked":
        appStatus.stop();

        localStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.SUCCESS,
          "Créneau réservé"
        );
        localStorage.locationLog(data.location, "Succes - Créneau réservé");

        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
        });
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.extension.getURL("icons/vaccine-color.svg"),
          title: "Votre créneau de vaccination a été réservé !",
          message: `Vous avez rendez-vous au centre "${data.location.name}".`,
        });
        break;
    }

    if (["error", "found", "booked"].includes(data.type)) {
      // Prévoir le job suivant
      jobs.add(data.url);
    }
  });

  // Récupérer le status initial de l'application PUIS executer les jobs
  Promise.all([appStatus.init(), localStorage.init()]).then(
    jobs.start.bind(this)
  );
})();
