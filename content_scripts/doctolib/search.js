(async function () {
  if (window.hasRun) return;
  window.hasRun = true;

  const MSG_ADD = " Ajouter à ma liste";
  const MSG_DELETE = " Retirer de ma liste";
  const ICON_URL = browser.runtime.getURL("icons/vaccine-color.svg");
  const MAX_LOCATIONS = 24; // Limite de storage.sync

  function addButtons(locations) {
    document
      .querySelectorAll(".div-vaccin-click")
      .forEach(($el) => $el.remove());

    document
      .querySelectorAll(".dl-search-result")
      .forEach(($el) => addButton($el, locations));
  }

  function addButton($el, locations) {
    const $a = $el.querySelector("h3 a");
    const locationUrl = new URL($a.href, window.origin).toString();

    const $btnContent = document.createElement("span");
    $btnContent.className = "dl-button-label";

    const $btnIcon = document.createElement("img");
    $btnIcon.src = ICON_URL;
    $btnIcon.width = 25;
    $btnContent.appendChild($btnIcon);

    const $btnText = document.createElement("span");
    $btnText.textContent = locations[locationUrl] ? MSG_DELETE : MSG_ADD;
    $btnContent.appendChild($btnText);

    const $btn = document.createElement("button");
    $btn.className =
      "button-vaccin-click dl-button-primary dl-button js-search-result-path";
    $btn.title =
      "vaccin.click : prendre automatiquement le prochain rendez-vous disponible dans ce centre";
    $btn.appendChild($btnContent);
    $btn.dataset.locationUrl = locationUrl;
    $btn.dataset.locationName = $a.textContent;
    $btn.dataset.locationImg = $el.querySelector(
      ".dl-search-result-avatar img"
    ).src;
    $btn.onclick = async function (e) {
      e.preventDefault();

      toggleLocation.bind(this, locations)();
    };

    const $div = document.createElement("div");
    $div.className =
      "div-vaccin-click dl-display-flex dl-justify-center dl-margin-y";
    $div.appendChild($btn);

    $el
      .querySelector(".dl-search-result-presentation > div:last-child")
      .insertAdjacentElement("beforebegin", $div);
  }

  async function toggleLocation(locations) {
    const locationUrl = this.dataset.locationUrl;

    if (locations[locationUrl]) {
      delete locations[locationUrl];
    } else {
      if (Object.keys(locations).length >= MAX_LOCATIONS) {
        alert(
          "Pour ne pas trop charger les serveurs de Doctolib, il n'est pas possible de surveiller plus de 24 centres en même temps. Supprimez des centres de votre liste pour en ajouter d'autres."
        );
        return;
      }

      locations[locationUrl] = {
        name: this.dataset.locationName,
        img: this.dataset.locationImg,
      };
    }

    await browser.storage.sync.set({ locations });
  }

  const { locations } = await browser.storage.sync.get({
    locations: {},
  });

  addButtons(locations);

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (areaName !== "sync" || !change.locations) return;

    addButtons(change.locations.newValue || {});
  });
})();
