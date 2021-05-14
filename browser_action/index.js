// Ce script affiche les boutons dans les résultats de la recherche
// permettant de sélectionner les centres dans lesquels prendre RDV automatiquement
(async function () {
  const $locations = document.getElementById("locations");
  const $template = document.getElementById("location");

  function displayLocations(locations) {
    Object.entries(locations).forEach(([url, { name, img }]) => {
      const $location = $template.content.cloneNode(true);
      const $a = $location.querySelector("a");

      $a.textContent = name;
      $a.href = url;

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

  const { locations, stopped, autoBook } = await browser.storage.sync.get({
    locations: {},
    autoBook: false,
    stopped: false,
  });

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName !== "sync") return;

    if (change.locations) {
      $locations.innerHTML = "";
      displayLocations(change.locations.newValue || {});
    }

    if (change.stopped) displayStopStart(change.stopped.newValue || false);

    if (change.autoBook)
      document.getElementById(
        change.autoBook.newValue || false ? "enableAutoBook" : "disableAutoBook"
      ).checked = true;
  });

  document.getElementById("stop").onclick = async () => {
    await browser.storage.sync.set({ stopped: true });
    displayStopStart(true);
  };

  document.getElementById("start").onclick = async () => {
    await browser.storage.sync.set({ stopped: false });
    displayStopStart(false);
  };

  document.getElementById("reset").onclick = async () => {
    if (
      !confirm(
        "Êtes-vous sur de vouloir supprimer toutes les données de l'extension ?"
      )
    )
      return;

    await browser.storage.sync.clear();
  };

  document.getElementById("disableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: false });
  document.getElementById("enableAutoBook").onclick = async () =>
    await browser.storage.sync.set({ autoBook: true });

  displayStopStart(stopped);

  document.getElementById(
    autoBook ? "enableAutoBook" : "disableAutoBook"
  ).checked = true;

  displayLocations(locations);
})();
