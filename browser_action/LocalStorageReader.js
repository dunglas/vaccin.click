class LocalStorageReader extends AbstractLocalStorage {
  /**
   * @param {{ 
   *   onLocationsChanged: (locations: LocationStatus[]) => void 
   *   onLogsChanged: (logs: string[]) => void 
   * }} callbacks 
   */
  constructor(callbacks) {
    super();

    /** @type {(LocationStatus[]) => void} callback quand une {@link LocationStatus} a changé */
    this.onLocationsChangedCb = callbacks.onLocationsChanged;

    /** @type {(string) => void} callback quand un log a été ajouté */
    this.onLogsChangedCb = callbacks.onLogsChanged;

    browser.storage.onChanged.addListener(this.onStorageChange.bind(this));
  }

  /**
   * @returns {Promise<void>} Une promesse resolue quand le traitement est fini
   */
  init() {
    return super.init().then(() => {
      this.onLogsChangedCb(this.logs);
      this.onLocationsChangedCb(this.locations);
    });
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
}