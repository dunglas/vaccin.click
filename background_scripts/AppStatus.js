class VaccineLocation {
  /**
   * @param {{ name: string, img: string }} attributes Un lieu à surveiller
   */
  constructor(attributes) {
    /** @type {string} Nom du lieu */
    this.name = attributes.name;
    /** @type {string} Url du logo du lieu */
    this.url = attributes.url;
  }
}

class AppStatus {
  constructor() {
    /** @type {Object<string, VaccineLocation>} map de lieux à vérifier */
    this.locations = {};
    /** @type {boolean} est-ce que l'app est active ? */
    this.stopped = false;
    /** @type {(string) => void} callback quand une {@link VaccineLocation} a été ajouté */
    this.onLocationAddedCb = (job) => {};
    /** @type {(string) => void} callback quand une {@link VaccineLocation} a été supprimée */
    this.onLocationDeletedCb = (job) => {};
    /** @type {(boolean) => void} callback quand stopped change de valeur */
    this.onStoppedChangeCb = (newValue) => {};

    browser.storage.onChanged.addListener(this.onStorageChange.bind(this));
  }

  /**
   * @returns {Promise<void>} Une promesse resolue quand le traitement est fini
   */
  init() {
    return browser.storage.sync
      .get({
        locations: {},
        stopped: false,
      })
      .then((result) => {
        Object.keys(result.locations).forEach((url) => {
          this.locations[url] = new VaccineLocation(result.locations[url]);
          this.onLocationAddedCb(url);
        });

        this.stopped = result.stopped === true;
        this.onStoppedChangeCb(this.stopped);
      });
  }

  /**
   * @param {string} url L'url à rechercher
   * @returns {VaccineLocation} Le lieu correspondante si il existe, sinon undefined
   */
  getLocation(url) {
    return this.locations[url];
  }

  /**
   * @param {(string) => void} cbAdd callback quand une {@link VaccineLocation} a été ajouté
   * @param {(string) => void} cbDelete callback quand une {@link VaccineLocation} a été supprimée
   */
  onLocationChange(cbAdd, cbDelete) {
    this.onLocationAddedCb = cbAdd;
    this.onLocationDeletedCb = cbDelete;
  }

  /**
   * @param {(boolean) => void} callback quand stopped change de valeur
   */
  onStoppedChange(callback) {
    this.onStoppedChangeCb = callback;
  }

  stop() {
    this.stopped = true;
    browser.storage.sync.set({ stopped: this.stopped });
  }

  /**
   * @private
   */
  onStorageChange(change, areaName) {
    if (areaName !== "sync") return;

    if (change.locations && change.locations.newValue) {
      Object.keys(this.locations).forEach((url) => {
        if (change.locations.newValue[url] === undefined) {
          delete this.locations[url];

          this.onLocationDeletedCb(url);
        }
      });

      Object.keys(change.locations.newValue).forEach((url) => {
        if (this.locations[url] === undefined) {
          this.locations[url] = new VaccineLocation(
            change.locations.newValue[url]
          );
        }

        this.onLocationAddedCb(url);
      });
    }

    if (change.stopped) {
      this.stopped = change.stopped.newValue === true;

      this.onStoppedChangeCb(this.stopped);
    }
  }
}
