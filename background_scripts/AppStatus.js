class Location {
  /** @type {string} Nom du lieu */
  name;
  /** @type {string} Url du logo du lieu */
  img;

  /**
   * @param {{ name: string, img: string }} attributes Un lieu à surveiller
   */
  constructor(attributes) {
    this.name = attributes.name;
    this.url = attributes.url;
  }
}

class AppStatus {
  /** @type {Object<string, Location>} map de lieux à vérifier */
  locations = {};
  /** @type {boolean} est-ce que l'app est active ? */
  stopped = false;
  /** @type {(string) => void} callback quand une {@link Location} a été ajouté */
  onLocationAddedCb = (job) => { };
  /** @type {(string) => void} callback quand une {@link Location} a été supprimée */
  onLocationDeletedCb = (job) => { };
  /** @type {(boolean) => void} callback quand stopped change de valeur */
  onStoppedChangeCb = (newValue) => { };

  constructor() {
    browser.storage.onChanged.addListener(this.onStorageChange.bind(this));
  }

  init() {
    return browser.storage.sync.get({
      locations: {},
      stopped: false,
    }).then((result) => {
      Object.keys(result.locations).forEach((url) => {
        this.locations[url] = new Location(result.locations[url]);
        this.onLocationAddedCb(url);
      });

      this.stopped = result.stopped === true;
      this.onStoppedChangeCb(this.stopped);
    });
  }

  /**
   * @param {string} url L'url à rechercher
   * @returns {Location} La {@link Location} correspondante si elle existe, sinon undefined
   */
  getLocation(url) {
    return this.locations[url];
  }

  /**
   * @param {(string) => void} cbAdd callback quand une {@link Location} a été ajouté
   * @param {(string) => void} cbDelete callback quand une {@link Location} a été supprimée
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
          this.locations[url] = new Location(change.locations.newValue[url]);
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
