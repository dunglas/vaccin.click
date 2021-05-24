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
class AbstractLocalStorage {
  /**
   * @param {number} maxLogs Nombre maximum de logs à garder
   */
  constructor() {
    /** @type {Object<string, LocationStatus>} map de status par lieu */
    this.locations = {};
    /** @type {string[]} tableau de logs */
    this.logs = [];
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
      });
  }
}
