class VaccineLocation {
  /**
   * @param {{ name: string, img: string }} attributes Un lieu à surveiller
   */
  constructor(attributes) {
    /** @type {string} Nom du lieu */
    this.name = attributes.name;
    /** @type {string} Url du logo du lieu */
    this.img = attributes.img;
  }
}

class AppStatus {
  constructor() {
    /** @type {Object<string, VaccineLocation>} map de lieux à vérifier */
    this.locations = {};
    /** @type {boolean} est-ce que l'app est active ? */
    this.stopped = false;
    /** @type {boolean} est-ce qu'on souhaite réserver le créneau pour le user ? */
    this.autoBook = false;
    /** @type {'fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly'} type d'injection souhaité par le user */
    this.injectionType = "fullServiceInjection";
    /** @type {'modernaInjection' | 'pfizerInjection'} vaccin d'injection souhaité par le user */
    this.injectionVaccine = "pfizerInjection";
    /** @type {Date} Date max de recherche de rdv (par défaut aujd + 1 mois) */
    this.dateMaxSearch = new Date((new Date()).getFullYear()+1, (new Date()).getMonth(), (new Date()).getDate());
    /** @type {(string) => void} callback quand une {@link VaccineLocation} a été ajouté */
    this.onLocationAddedCb = (job) => {};
    /** @type {(string) => void} callback quand une {@link VaccineLocation} a été supprimée */
    this.onLocationDeletedCb = (job) => {};
    /** @type {(boolean) => void} callback quand stopped change de valeur */
    this.onStoppedChangeCb = (newValue) => {};
    /** @type {(boolean) => void} callback quand autoBook change de valeur */
    this.onAutoBookChangeCb = (newValue) => {};
    /** @type {('fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly') => void} callback quand injectionType change de valeur */
    this.onInjectionTypeCb = (newValue) => {};
    /** @type {'modernaInjection' | 'pfizerInjection'} callback quand injectionVaccine change de valeur */
    this.onInjectionVaccineCb = (newValue) => {};
    /** @type {Date} callback quand maxDateSearch change de valeur */
    this.onDateMaxSearchCb = (newValue) => {};

    this.onStorageChange = this.onStorageChange.bind(this);
    browser.storage.onChanged.addListener(this.onStorageChange);
  }

  /**
   * @returns {Promise<void>} Une promesse resolue quand le traitement est fini
   */
  async init() {
    const result = await browser.storage.sync.get({
      locations: {},
      stopped: false,
      autoBook: false,
      injectionType: "fullServiceInjection",
      injectionVaccine: "pfizerInjection",
      dateMaxSearch: new Date((new Date()).getFullYear()+1, (new Date()).getMonth(), (new Date()).getDate()),
    });

    Object.keys(result.locations).forEach((url) => {
      this.locations[url] = new VaccineLocation(result.locations[url]);
      this.onLocationAddedCb(url);
    });

    this.stopped = result.stopped === true;
    this.onStoppedChangeCb(this.stopped);

    this.autoBook = result.autoBook === true;
    this.onAutoBookChangeCb(this.autoBook);

    this.injectionType = result.injectionType;
    this.onInjectionTypeCb(this.injectionType);

    this.injectionVaccine = result.injectionVaccine;
    this.onInjectionVaccineCb(this.injectionVaccine);

    this.dateMaxSearch = result.dateMaxSearch;
    this.onDateMaxSearchCb(this.dateMaxSearch);
  }

  getLocations() {
    return this.locations;
  }

  /**
   * @param {string} url L'url à rechercher
   * @returns {VaccineLocation} Le lieu correspondante si il existe, sinon undefined
   */
  getLocation(url) {
    return this.locations[url];
  }

  deleteLocation(url) {
    if (this.locations[url] !== undefined) {
      delete this.locations[url];

      browser.storage.sync.set({ locations: this.locations });
    }
  }

  getStopped() {
    return this.stopped;
  }

  getAutoBook() {
    return this.autoBook;
  }

  getInjectionType() {
    return this.injectionType;
  }

  getInjectionVaccine() {
    return this.injectionVaccine;
  }

  getDateMaxSearch() {
    return this.dateMaxSearch;
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

  /**
   * @param {(boolean) => void} callback quand autoBook change de valeur
   */
  onAutoBookChange(callback) {
    this.onAutoBookChangeCb = callback;
  }

  /**
   * @param {('fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly') => void} callback quand injectionType change de valeur
   */
  onInjectionTypeChange(callback) {
    this.onInjectionTypeCb = callback;
  }

  /**
   * @param {('modernaInjection' | 'pfizerInjection') => void} callback quand injectionVaccine change de valeur
   */
  onInjectionVaccineChange(callback) {
    this.onInjectionVaccineCb = callback;
  }

  /**
   * @param {(Date) => void} callback quand dateMaxSearch change de valeur
   */
  onDateMaxSearchChange(callback) {
    this.onDateMaxSearchCb = callback;
  }

  start() {
    this.stopped = false;
    browser.storage.sync.set({ stopped: this.stopped });
  }

  stop() {
    this.stopped = true;
    browser.storage.sync.set({ stopped: this.stopped });
  }

  /**
   * @param {boolean} value The new autoBook value
   */
  setAutoBook(value) {
    this.autoBook = value === true;
    browser.storage.sync.set({ autoBook: this.autoBook });
  }

  /**
   * @param {'fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly'} value The new injectionType value
   */
  setInjectionType(value) {
    this.injectionType = value;
    browser.storage.sync.set({ injectionType: this.injectionType });
  }


  /**
   * @param {Date} value The new dateMaxSearch value
   */
  setDateMaxSearch(value) {
    this.dateMaxSearch = new Date(value.value);
    browser.storage.sync.set({ dateMaxSearch: this.dateMaxSearch });
  }

  /**
   * @param {'modernaInjection' | 'pfizerInjection'} value The new injectionVaccine value
   */
  setInjectionVaccine(value) {
    this.injectionVaccine = value;
    browser.storage.sync.set({ injectionVaccine: this.injectionVaccine });
  }

  /**
   * Gérer le clean complet du stockage de l'application
   */
  clear() {
    browser.storage.sync.remove(["locations", "stopped", "autoBook"]);

    const oldLocations = this.locations;
    this.locations = {};
    Object.keys(oldLocations).forEach(this.onLocationDeletedCb, this);
    this.stopped = false;
    this.onStoppedChangeCb(this.stopped);
    this.autoBook = false;
    this.onAutoBookChangeCb(this.autoBook);
    this.injectionType = "fullServiceInjection";
    this.onInjectionTypeCb(this.injectionType);
    this.injectionVaccine = "pfizerInjection";
    this.onInjectionTypeCb(this.injectionVaccine);
    this.dateMaxSearch = new Date((new Date()).getFullYear(), (new Date()).getMonth()+1, (new Date()).getDate());
    this.onDateMaxSearchCb(this.dateMaxSearch);
  }

  /**
   * Une methode à appeler sur le unload de la page pour détruire ce qu'il y a à détruire !
   */
  destroy() {
    // Stopper les eventHandlers
    browser.storage.onChanged.removeListener(this.onStorageChange);

    // Detacher les callbacks
    this.onLocationAddedCb = null;
    this.onLocationDeletedCb = null;
    this.onStoppedChangeCb = null;
    this.onAutoBookChangeCb = null;
    this.onInjectionTypeCb = null;
    this.onInjectionVaccineCb = null;
    this.onDateMaxSearchCb = null;
  }

  /**
   * @private
   */
  onStorageChange(change, areaName) {
    if (areaName !== "sync") return;

    if (change.locations) {
      change.locations.newValue = change.locations.newValue || {};

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

    if (change.autoBook) {
      this.autoBook = change.autoBook.newValue === true;

      this.onAutoBookChangeCb(this.autoBook);
    }

    if (change.injectionType) {
      this.injectionType = change.injectionType.newValue;

      this.onInjectionTypeCb(this.injectionType);
    }

    if (change.injectionVaccine) {
      this.injectionVaccine = change.injectionVaccine.newValue;

      this.onInjectionVaccineCb(this.injectionVaccine);
    }
    if (change.dateMaxSearch) {
      this.dateMaxSearch = change.dateMaxSearch.newValue;

      this.onDateMaxSearchCb(this.dateMaxSearch);
    }
  }
}
