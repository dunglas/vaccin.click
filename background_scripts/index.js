// Scan périodique des RDV
(async function () {
  const appStatus = new AppStatus();
  const vCLStorage = new VCLocalStorage();
  const jobs = new JobQueue(10000, 45000, (job) => {
    vCLStorage.setLocationStatus(
      job,
      LocationCheckStatus.WORKING,
      browser.i18n.getMessage("locationCheckInProgress")
    );
    vCLStorage.locationLog(
      appStatus.getLocation(job),
      browser.i18n.getMessage("locationCheckStarted")
    );

    // Prévoir le job suivant
    jobs.add(job);
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
        vCLStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.ERROR,
          data.error.message
        );
        vCLStorage.locationLog(
          data.location,
          browser.i18n.getMessage("fail") + " - " + data.error.message
        );
        break;

      case "found":
        vCLStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.SUCCESS,
          "Créneau trouvé"
        );
        vCLStorage.locationLog(
          data.location,
          browser.i18n.getMessage("successSlotFound")
        );

        const tabs = await browser.tabs.query({ url: data.url });

        // Ne pas réouvrir l'onglet si il est déjà ouvert
        if (0 !== tabs.length) break;

        await browser.tabs.create({ url: data.url });

        await browser.notifications.create(data.url, {
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/vaccine-color.svg"),
          title: browser.i18n.getMessage("notificationTitleSlotFound"),
          message: browser.i18n.getMessage(
            "notificationBodySlotFound",
            data.location.name
          ),
          priority: 2,
        });
        break;

      case "booked":
        appStatus.stop();

        vCLStorage.setLocationStatus(
          data.url,
          LocationCheckStatus.SUCCESS,
          "Créneau réservé"
        );
        vCLStorage.locationLog(data.location, "Succes - Créneau réservé");

        await browser.tabs.create({
          url: "https://twitter.com/intent/tweet?text=J%27ai%20r%C3%A9serv%C3%A9%20automatiquement%20mon%20rendez-vous%20de%20vaccination%20%23COVID19%20gr%C3%A2ce%20%C3%A0%20https%3A%2F%2Fvaccin.click%20de%20%40dunglas",
        });
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/vaccine-color.svg"),
          title: browser.i18n.getMessage("notificationTitleSlotBooked"),
          message: browser.i18n.getMessage(
            "notificationBodySlotBooked",
            data.location.name
          ),
        });
        break;
    }
  });

  // Récupérer le status initial de l'application
  await Promise.all([appStatus.init(), vCLStorage.init()]);

  // Executer les jobs
  vCLStorage.log(
    browser.i18n.getMessage("extensionStartMessage", jobs.jobs.length)
  );
  jobs.start();
  vCLStorage.startCheckLocations();
})();
