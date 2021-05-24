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
  onLocationAdded;
  /** @type {(string) => void} callback quand une {@link Location} a été supprimée */
  onLocationDeleted;
  /** @type {(boolean) => void} callback quand stopped change de valeur */
  onStoppedChange;

  /**
   * 
   * @param {{ onLocationAdded: (string) => void, onLocationDeleted: (string) => void, onStoppedChange: (boolean) => void }} callbacks map de differents callbacks
   */
  constructor(callbacks) {
    this.onLocationAdded = callbacks.onLocationAdded ? callbacks.onLocationAdded : (job) => { };
    this.onLocationDeleted = callbacks.onLocationDeleted ? callbacks.onLocationDeleted : (job) => { };
    this.onStoppedChange = callbacks.onStoppedChange ? callbacks.onStoppedChange : (newValue) => { };

    browser.storage.onChanged.addListener(this.onStorageChange.bind(this));

    browser.storage.sync.get({
      locations: {},
      stopped: false,
    }).then((result) => {
      Object.keys(result.locations).forEach((url) => {
        this.locations[url] = new Location(result.locations[url]);
        this.onLocationAdded(url);
      });

      this.stopped = result.stopped === true;
      this.onStoppedChange(this.stopped);
    });
  }

  /**
   * 
   * @param {(string) => void} cbAdd callback quand une {@link Location} a été ajouté
   * @param {(string) => void} cbDelete callback quand une {@link Location} a été supprimée
   */
   onLocationChange(cbAdd, cbDelete) {
    this.onLocationAdded = cbAdd;
    this.onLocationDeleted = cbDelete;
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

          this.onLocationDeleted(url);
        }
      });

      Object.keys(change.locations.newValue).forEach((url) => {
        if (this.locations[url] === undefined) {
          this.locations[url] = new Location(change.locations.newValue[url]);
        }

        this.onLocationAdded(url);
      });
    }

    if (change.stopped) {
      this.stopped = change.stopped.newValue === true;

      if (this.stopped) {
        jobs.stop();
      }
      else {
        jobs.start();
      }

      this.onStoppedChange(this.stopped);
    }
  }
}
