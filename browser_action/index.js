// Ce script affiche les boutons dans les résultats de la recherche
// permettant de sélectionner les centres dans lesquels prendre RDV automatiquement
(async function () {
  const $locations = document.getElementById("locations");
  const $template = document.getElementById("location");
  const $debugActivity = document.getElementById("debugActivity");

  function displayActivities(activities) {
    $debugActivity.innerHTML = "";

    activities.forEach((activity) => {
      const $li = document.createElement("li");
      $li.innerText = activity;
      $debugActivity.appendChild($li);
      $debugActivity.scrollTop = $debugActivity.scrollHeight;
    });
  }

  function displayLocations(locations, localLocations) {
    $locations.innerHTML = "";

    locations = locations || {};
    localLocations = localLocations || {};

    Object.entries(locations).forEach(([url, { name, img }]) => {
      const localLocation = localLocations[url] || {};

      const $location = $template.content.cloneNode(true);
      const $item = $location.querySelector(".panel-list-item");
      const $a = $location.querySelector("a");
      $a.innerText = name;
      $a.href = url;

      $location.querySelector(".date").innerText = localLocation.date
        ? new Date(localLocation.date).toLocaleTimeString()
        : "";

      if (localLocation.status)
        $item.classList.add("status-" + localLocation.status);
      $location.querySelector("img").src = img;
      $location.querySelector("button").onclick = async () => {
        if (
          !confirm(`Êtes-vous sur de vouloir retirer "${name}" de la liste ?`)
        )
          return;

        const { locations } = await browser.storage.sync.get({
          locations: {},
        });
        delete locations[url];

        await browser.storage.sync.set({ locations });
      };

      $locations.appendChild($location);
    });
  }

  function displayStopStart(stopped) {
    document.getElementById(stopped ? "start" : "stop").style =
      "display: block";
    document.getElementById(stopped ? "stop" : "start").style = "display: none";
  }

  let { locations, autoBook } = await browser.storage.sync.get({
    locations: {},
    autoBook: false,
  });

  let { stopped } = await browser.storage.local.get({ stopped: false });

  let { localLocations } = await browser.storage.local.get({ locations: {} });

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName === "local") {
      if (change.activities)
        displayActivities(change.activities.newValue || []);

      if (change.locations) {
        localLocations = change.locations.newValue;
        displayLocations(locations, localLocations);
      }

      if (change.stopped) displayStopStart(change.stopped.newValue || false);
    }

    if (areaName === "sync") {
      if (change.locations) {
        locations = change.locations.newValue;
        displayLocations(locations, localLocations);
      }

      if (change.autoBook)
        document.getElementById(
          change.autoBook.newValue || false
            ? "enableAutoBook"
            : "disableAutoBook"
        ).checked = true;
    }
  });

  document.getElementById("stop").onclick = async () => {
    await browser.storage.local.set({ stopped: true });
  };

  document.getElementById("start").onclick = async () => {
    await browser.storage.local.set({ stopped: false });
  };

  document.getElementById("reset").onclick = async () => {
    if (
      !confirm(
        "Êtes-vous sur de vouloir supprimer toutes les données de l'extension ?"
      )
    )
      return;

    await browser.storage.sync.clear();
    await browser.storage.local.clear();
  };

  document.getElementById("disableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: false });
  document.getElementById("enableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: true });

  displayStopStart(stopped);

  document.getElementById(
    autoBook ? "enableAutoBook" : "disableAutoBook"
  ).checked = true;

  displayLocations(locations, localLocations);

  const { activities } = await browser.storage.local.get({ activities: [] });
  displayActivities(activities);
})();
