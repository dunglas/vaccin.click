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

  /**
   * @param {number} duration La durée à utiliser pour la comparaison, en ms
   * @returns {boolean} true si le job a été lancé il y a moins de {@link duration} ms
   */
  isOlderThan(duration) {
    return Date.now() - this.lastExecutionTimestamp >= duration;
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
  // TODO: passer en secondes
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
    this.demons = {};
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
    // Supprime un potentiel job existants
    const existingJobIndex = this.jobs.indexOf(job);
    if (existingJobIndex >= 0) {
      this.jobs.splice(existingJobIndex, 1);
    }
  }

  /**
   * @param {string} job Url d'un job
   */
  kill(job) {
    if (!this.demons.hasOwnProperty(job)) return;

    // Tue & supprime le démon existant
    this.demons[job].kill();
    delete this.demons[job];
  }

  executeNextJob() {
    const job = this.jobs.shift();
    if (!job) return;

    // Si un démon a déjà été lancé pour ce job
    if (this.demons.hasOwnProperty(job)) {
      // Si ce démon est déjà vieux on peut le relancer
      if (this.demons[job].isOlderThan(this.delayRetryJob)) {
        this.onJobStart(job);
        this.demons[job].retry();
        return;
      }

      // Sinon on remet le job a la fin de la liste, il sera executé plus tard
      this.add(job);
      return;
    }

    // Sinon on crée un nouveau démon pour executer ce job
    this.onJobStart(job);
    this.demons[job] = new JobDemon(job);
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
