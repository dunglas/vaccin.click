/**
 * Enum pour les status de vérification
 * @readonly
 * @enum {string}
 */
const LocationCheckStatus = Object.freeze({
  ERROR: "e",
  SUCCESS: "s",
  WORKING: "w",
});

/**
 * @typedef {{
 *  status: LocationCheckStatus,
 *  message: string,
 *  date: number
 * }} LocationStatus
 */
class VCLocalStorage {
  /**
    * @param {{
   *   listenChanges? = false;
   *   onLocationsChanged?: (locations: LocationStatus[]) => void;
   *   onLogsChanged?: (logs: string[]) => void;
   * }?} options Options du constructeur
   */
  constructor(options) {
    /** @type {number} Nombre maximum de logs à garder */
    this.maxLogs = 30;
    /** @type {number} Durée de vie en ms du status d'un lieu */
    this.statusMaxDuration = 10 * 60 * 1000;
    /** @type {Object<string, LocationStatus>} map de status par lieu */
    this.locations = {};
    /** @type {string[]} tableau de logs */
    this.logs = [];

    options = options || {};

    /** @type {(LocationStatus[]) => void} callback quand une {@link LocationStatus} a changé */
    this.onLocationsChangedCb = options.onLocationsChanged ? options.onLocationsChanged : () => { };
    /** @type {(string) => void} callback quand un log a été ajouté */
    this.onLogsChangedCb = options.onLogsChanged ? options.onLogsChanged : () => { };

    if (options.listenChanges)
      browser.storage.onChanged.addListener(this.onStorageChange.bind(this));
  }

  /**
   * @returns {Object<string, LocationStatus>}
   */
  getLocations() {
    return this.locations;
  }

  /**
   * @returns {Promise<void>} Une promesse resolue quand le traitement est fini
   */
  init() {
    return browser.storage.local
      .get({
        locations: {},
        logs: [],
      })
      .then((result) => {
        this.locations = result.locations;
        this.logs = result.logs;

        this.onLocationsChangedCb(this.locations);
        this.onLogsChangedCb(this.logs);
      });
  }

  /**
   * @param {string} message Un message à loguer
   */
  log(message) {
    this.logs.push(new Date().toLocaleTimeString() + " - " + message);

    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    browser.storage.local.set({ logs: this.logs });
  }

  /**
   * @param {VaccineLocation} location Le lieu concerné
   * @param {string} message Un message à loguer
   */
  locationLog(location, message) {
    this.log(location.name + " - " + message);
  }

  /**
   * @param {string} locationUrl L'url du lieu à éditer
   * @param {LocationCheckStatus} status Le status à associer au lieu
   * @param {string?} message Un commentaire sur le status
   */
  setLocationStatus(locationUrl, status, message) {
    this.locations[locationUrl] = {
      status: status,
      message: message,
      date: Date.now(),
    };

    browser.storage.local.set({ locations: this.locations });
  }

  startCheckLocations() {
    setInterval(this.cleanOutDatedLocations.bind(this), this.statusMaxDuration);
    this.cleanOutDatedLocations();
  }

  /**
   * @private
   */
  onStorageChange(change, areaName) {
    if (areaName !== "local") return;

    if (change.locations && change.locations.newValue) {
      this.locations = change.locations.newValue;
      this.onLocationsChangedCb(this.locations);
    }

    if (change.logs) {
      this.logs = change.logs.newValue;
      this.onLogsChangedCb(this.logs);
    }
  }

  /**
   * @private
   */
  cleanOutDatedLocations() {
    Object.keys(this.locations).forEach(locUrl => {
      if (Date.now() - this.locations[locUrl].date > this.statusMaxDuration) {
        delete this.locations[locUrl];
      }
    });

    browser.storage.local.set({ locations: this.locations });
    this.log('Suppression des vieux status');
  }
}
