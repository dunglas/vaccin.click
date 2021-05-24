class LocalStorage extends AbstractLocalStorage {
  /**
   * @param {number} maxLogs Nombre maximum de logs à garder
   */
  constructor(maxLogs) {
    super();

    /** @type {number} maxLogs Nombre maximum de logs à garder */
    this.maxLogs = maxLogs;
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
