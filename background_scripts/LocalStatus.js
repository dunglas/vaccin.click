/**
 * @typedef {{
 *  status: LocationCheckStatus,
 *  date: number
 * }} LocationStatus
 */

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

class LocalStatus {
  /**
   * @param {number} maxLogs Nombre maximum de logs à garder
   */
  constructor(maxLogs) {
    /** @type {number} maxLogs Nombre maximum de logs à garder */
    this.maxLogs = maxLogs;
    /** @type {Object<string, LocationStatus>} map de status par {@link Location} */
    this.locations = {};
    /** @type {string[]} tableau de logs */
    this.logs = [];
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
   * @param {Location} location La {@link Location} concerné
   * @param {string} message Un message à loguer
   */
  locationLog(location, message) {
    this.log(location.name + " - " + message);
  }

  /**
   * @param {string} locationUrl L'url d'une {@link Location} à éditer
   * @param {LocationCheckStatus} status Le status à associer au lieu
   */
  setLocationStatus(locationUrl, status) {
    this.locations[locationUrl] = {
      status: status,
      date: Date.now(),
    };

    browser.storage.local.set({ locations: this.locations });
  }
}
