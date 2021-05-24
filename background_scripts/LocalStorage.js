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
}
