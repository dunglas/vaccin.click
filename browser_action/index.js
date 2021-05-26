// Ce script affiche les boutons dans les résultats de la recherche
// permettant de sélectionner les centres dans lesquels prendre RDV automatiquement
(async function () {
  // Dom
  const $locations = document.getElementById("locations");
  const $template = document.getElementById("location");
  const $debugActivity = document.getElementById("debugActivity");

  // Dom manipulation

  function displayLogs(logLines) {
    $debugActivity.innerHTML = "";

    logLines.forEach((log) => {
      const $li = document.createElement("li");
      $li.innerText = log;
      $debugActivity.appendChild($li);
    });

    $debugActivity.scrollTop = $debugActivity.scrollHeight;
  }

  /**
   * @param {Object<string, VaccineLocation>} locations
   * @param {Object<string, LocationStatus>} localLocations
   */
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

      $location.querySelector(".date").innerText = localLocation && localLocation.date
        ? new Date(localLocation.date).toLocaleTimeString()
        : "";

      if (localLocation && localLocation.status)
        $item.classList.add("status-" + localLocation.status);

      if (localLocation && localLocation.message) $item.title = localLocation.message;

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

  // Initialisation donnée
  appStatus.init();
  vCLStorage.init();

  // Set des events
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
  displayStopStart(appStatus.getStopped());
  displayAutoBook(appStatus.getAutoBook());
  displayLocations();
})();
