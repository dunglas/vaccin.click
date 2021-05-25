class JobDemon {
  /**
   * @param {string} url Url d'un job
   */
  constructor(url) {
    /** @type {string} */
    this.url = url;
    /** @type {HTMLIFrameElement} */
    this.iframe = document.createElement("iframe");
    /** @type {number} */
    this.lastExecutionTimestamp = Date.now();

    // On charge l'URL dans une iframe
    // Ici on laisse la main au content script qui va vérifier si un RDV est disponible
    this.iframe.src = url;

    document.body.appendChild(this.iframe);
  }

  retry() {
    this.iframe.contentWindow.postMessage({ type: "retry" }, "*");
    this.lastExecutionTimestamp = Date.now();
  }

  kill() {
    this.iframe.remove();
    this.iframe = null;
  }
}

class JobQueue {
  /**
   * @param {number} delayBetweenJobs Delais entre deux jobs, en secondes
   * @param {number} delayRetryJob Delais entre deux executions d'un même jobs, en secondes
   * @param {(job: string) => void} onJobStart Callback quand un job débute
   */
  constructor(delayBetweenJobs, minDelayRetryJob, onJobStart) {
    /** @type {number} en millisecondes */
    this.delayBetweenJobs = delayBetweenJobs * 1000;
    /** @type {number} en millisecondes */
    this.delayRetryJob = minDelayRetryJob * 1000;
    /** @type {(job: string) => void} Callback quand un job débute */
    this.onJobStart = onJobStart;
    /** @type {number} */
    this.intervalRef = null;
    /** @type {Object<string, JobDemon>} map de deamon traitant les jobs */
    this.deamons = {};
    /** @type {string[]} tableau d'url de job */
    this.jobs = [];
  }

  /**
   * @param {string} job Url d'un job
   */
  add(job) {
    if (this.jobs.includes(job)) return;

    this.jobs.push(job);
  }

  /**
   * @param {string} job Url d'un job
   */
  remove(job) {
    // Supprime les jobs existants
    while (this.jobs.includes(job)) {
      this.jobs.splice(this.jobs.indexOf(job), 1);
    }
  }

  /**
   * @param {string} job Url d'un job
   */
  kill(job) {
    // Supprimer les deamons existants
    if (!this.deamons.hasOwnProperty(job)) return;

    this.deamons[job].kill();
    delete this.deamons[job];
  }

  executeNextJob() {
    const job = this.jobs.shift();
    if (!job) return;

    if (this.deamons.hasOwnProperty(job)) {
      if (
        Date.now() - this.deamons[job].lastExecutionTimestamp >=
        this.delayRetryJob
      ) {
        this.onJobStart(job);
        this.deamons[job].retry();
        return;
      }

      this.jobs.push(job);
      return;
    }

    this.onJobStart(job);
    this.deamons[job] = new JobDemon(job);
  }

  start() {
    if (this.intervalRef !== null) return;

    this.intervalRef = setInterval(
      this.executeNextJob.bind(this),
      this.delayBetweenJobs
    );
    this.executeNextJob();
  }

  stop() {
    clearInterval(this.intervalRef);
    this.intervalRef = null;
  }
}
