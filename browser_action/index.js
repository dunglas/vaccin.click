// Ce script affiche les boutons dans les résultats de la recherche
// permettant de sélectionner les centres dans lesquels prendre RDV automatiquement
(async function () {
  // Dom
  const $locations = document.getElementById("locations");
  const $template = document.getElementById("location");
  const $debugActivity = document.getElementById("debugActivity");

  // Dom manipulation

  // Translate the text of all html elements with the attribute "data-i18n"
  function translateDom() {
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach(function (element) {
      const key = element.getAttribute("data-i18n");
      const value = browser.i18n.getMessage(key);
      element.innerHTML = value;
    });
  }

  /**
   * @param {string[]} logLines
   */
  function displayLogs(logLines) {
    // Preparer les nouveaux logs
    /** @type {HTMLLIElement[]} */
    const newLogsList = logLines
      .map((log) => {
        const $li = document.createElement("li");
        $li.innerText = log;
        return $li;
      })
      .reverse();

    // Vider les vieux logs
    while ($debugActivity.firstChild) {
      $debugActivity.removeChild($debugActivity.lastChild);
    }

    // Afficher les nouveaux logs
    $debugActivity.append(...newLogsList);
  }

  function displayLocations() {
    $locations.innerHTML = "";

    Object.keys(appStatus.getLocations()).forEach((url) => {
      const location = appStatus.getLocation(url);
      const localLocation = vCLStorage.getLocation(url);

      const $location = $template.content.cloneNode(true);
      const $item = $location.querySelector(".panel-list-item");
      const $a = $location.querySelector("a");
      $a.innerText = location.name;
      $a.href = url;

      $location.querySelector(".date").innerText =
        localLocation && localLocation.date
          ? new Date(localLocation.date).toLocaleTimeString()
          : "";

      if (localLocation && localLocation.status)
        $item.classList.add("status-" + localLocation.status);

      if (localLocation && localLocation.message)
        $item.title = localLocation.message;

      $location.querySelector("img").src = location.img;
      $location.querySelector("button").onclick = async () => {
        if (
          !confirm(
            `Êtes-vous sur de vouloir retirer "${location.name}" de la liste ?`
          )
        )
          return;

        appStatus.deleteLocation(url);
      };

      $locations.appendChild($location);
    });
  }

  function displayStopStart(stopped) {
    document.getElementById(stopped ? "start" : "stop").style =
      "display: block";
    document.getElementById(stopped ? "stop" : "start").style = "display: none";
  }

  function displayAutoBook(autoBook) {
    document.getElementById(
      autoBook ? "enableAutoBook" : "disableAutoBook"
    ).checked = true;
  }

  /** @param {'fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly'} injectionType Le type d'injection souhaité par le user */
  function displayInjectionType(injectionType) {
    document.getElementById(injectionType).checked = true;
  }

  /** @param {'modernaInjection' | 'pfizerInjection'} injectionVaccine Le vaccin d'injection souhaité par le user */
  function displayInjectionVaccine(injectionVaccine) {
    document.getElementById(injectionVaccine).checked = true;
  }

  /** @param {Date} dateMaxSearch La date maximale de recherche de rdv */
  function displayDateMaxSearch(dateMaxSearch) {
    const date = new Date(dateMaxSearch);
    document.getElementById("dateMax").value = date.toISOString().split("T")[0];
  }

  // Preparation des données
  const appStatus = new AppStatus();
  const vCLStorage = new VCLocalStorage({
    listenChanges: true,
    onLogsChanged: displayLogs,
    onLocationsChanged: () => {
      displayLocations(appStatus.getLocations());
    },
  });
  appStatus.onLocationChange(displayLocations, displayLocations);
  appStatus.onStoppedChange(displayStopStart);
  appStatus.onAutoBookChange(displayAutoBook);
  appStatus.onInjectionTypeChange(displayInjectionType);
  appStatus.onInjectionVaccineChange(displayInjectionVaccine);
  appStatus.onDateMaxSearchChange(displayDateMaxSearch);

  // Initialisation donnée
  appStatus.init();
  vCLStorage.init();

  // Installation des évènements
  window.addEventListener("unload", function (e) {
    vCLStorage.destroy();
    appStatus.destroy();
  });

  document.getElementById("stop").onclick = appStatus.stop;
  document.getElementById("start").onclick = appStatus.start;

  document.getElementById("disableAutoBook").onclick =
    appStatus.setAutoBook.bind(appStatus, false);
  document.getElementById("enableAutoBook").onclick =
    appStatus.setAutoBook.bind(appStatus, true);

  document.getElementById("fullServiceInjection").onclick =
    appStatus.setInjectionType.bind(appStatus, "fullServiceInjection");
  document.getElementById("firstInjectionOnly").onclick =
    appStatus.setInjectionType.bind(appStatus, "firstInjectionOnly");
  document.getElementById("secondInjectionOnly").onclick =
    appStatus.setInjectionType.bind(appStatus, "secondInjectionOnly");
  document.getElementById("thirdInjectionOnly").onclick =
    appStatus.setInjectionType.bind(appStatus, "thirdInjectionOnly");

  document.getElementById("modernaInjection").onclick =
    appStatus.setInjectionVaccine.bind(appStatus, "modernaInjection");
  document.getElementById("pfizerInjection").onclick =
    appStatus.setInjectionVaccine.bind(appStatus, "pfizerInjection");
  document.getElementById("dateMax").onblur = appStatus.setDateMaxSearch.bind(
    appStatus,
    document.getElementById("dateMax")
  );

  document.getElementById("reset").onclick = () => {
    if (
      !confirm(
        "Êtes-vous sur de vouloir supprimer toutes les données de l'extension ?"
      )
    )
      return;

    appStatus.clear();
    vCLStorage.clear();
  };

  // Affichage
  translateDom();
  displayStopStart(appStatus.getStopped());
  displayAutoBook(appStatus.getAutoBook());
  displayInjectionType(appStatus.getInjectionType());
  displayInjectionVaccine(appStatus.getInjectionVaccine());
  displayDateMaxSearch(appStatus.getDateMaxSearch());
  displayLocations();
})();
