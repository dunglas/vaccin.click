class JobDeamon {
  /** @type {string} */
  url;
  /** @type {HTMLIFrameElement} */
  iframe;

  /**
   * @param {string} job Url d'un job
   */
  constructor(url) {
    this.url = url;
    this.iframe = document.createElement("iframe");

    // On charge l'URL dans une iframe
    // Ici on laisse la main au content script qui va vérifier si un RDV est disponible
    this.iframe.src = url;

    document.body.appendChild(this.iframe);
  }

  retry() {
    this.iframe.contentWindow.postMessage({ type: "retry" }, "*");
  }

  kill() {
    this.iframe.remove();
    this.iframe = null;
  }
}

class JobQueue {
  /** @type {number} en millisecondes */
  delayBetweenJobs = 30 * 1000;
  /** @type {(job: string) => void} Callback quand un job débute */
  onJobStart = () => {};
  /** @type {number} */
  intervalRef = null;
  /** @type {Object<string, JobDeamon>} map de deamon traitant les jobs */
  deamons = {};
  /** @type {string[]} tableau d'url de job */
  jobs = [];

  /**
   * @param {number} delayBetweenJobs Delais entre deux jobs, en secondes
   * @param {(job: string) => void} onJobStart Callback quand un job débute
   */
  constructor(delayBetweenJobs, onJobStart) {
    this.delayBetweenJobs = delayBetweenJobs * 1000;
    this.onJobStart = onJobStart;
  }

  /**
   * @param {string} job Url d'un job
   */
  add(job) {
    if (!this.jobs.includes(job)) {
      this.jobs.push(job);
    }
  }

  /**
   * @param {string} job Url d'un job
   */
  remove(job) {
    // Supprime les jobs existants
    while (this.jobs.includes(url)) {
      jobs.splice(jobs.indexOf(url), 1);
    }
  }

  /**
   * @param {string} job Url d'un job
   */
  kill(job) {
    // Supprimer les deamons existants
    if (this.deamons.hasOwnProperty(job)) {
      this.deamons[job].kill();
      delete this.deamons[job];
    }
  }

  executeNextJob() {
    const job = this.jobs.shift();
    if (job) {
      this.onJobStart(job);

      if (this.deamons.hasOwnProperty(job)) {
        this.deamons[job].retry();
      }
      else {
        this.deamons[job] = new JobDeamon(job);
      }
    }
  }

  start() {
    this.intervalRef = setInterval(this.executeNextJob.bind(this), this.delayBetweenJobs);
    this.executeNextJob();
  }

  stop() {
    clearInterval(this.intervalRef);
  }
}