const logger = require('../utils/logger');

/**
 * In-memory job queue — replaces Bull for environments without Redis.
 * Fixed: CRIT-03 (getJob/getState/progress), QUAL-03 (3-arg process API),
 * QUAL-10 (waitForIdle for graceful shutdown).
 */
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.queue = [];
    this.processor = null;
    this.isProcessing = false;
    // Track all jobs by id so getJob() works
    this.jobs = new Map(); // id -> { state, progress, result, failedReason }
  }

  /**
   * Bull-compatible: process(name, fn) or process(name, concurrency, fn) or process(fn)
   * QUAL-03: handle all three call signatures
   */
  process(nameOrFn, concurrencyOrFn, fn) {
    if (typeof nameOrFn === 'function') {
      this.processor = nameOrFn;
    } else if (typeof concurrencyOrFn === 'function') {
      this.processor = concurrencyOrFn;
    } else if (typeof fn === 'function') {
      this.processor = fn;
    }
  }

  async add(name, data, opts) {
    // If no name is provided, first argument is data
    let jobName = name;
    let jobData = data;
    if (typeof name === 'object') {
      jobName = 'default';
      jobData = name;
    }

    const id = (opts && opts.jobId) ? opts.jobId : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const jobMeta = { state: 'waiting', progress: 0, result: null, failedReason: null };
    this.jobs.set(id, jobMeta);

    const job = { id, name: jobName, data: jobData, opts: opts || {} };
    this.queue.push(job);
    logger.info(`Job added to ${this.name} queue`, { name: jobName, id });

    // Trigger processing asynchronously
    setTimeout(() => this.processNext(), 100);
    return {
      id,
      progress: () => jobMeta.progress,
      getState: () => Promise.resolve(jobMeta.state),
    };
  }

  /**
   * CRIT-03: Retrieve a job by ID so status polling works.
   */
  getJob(id) {
    const meta = this.jobs.get(String(id));
    if (!meta) return Promise.resolve(null);
    return Promise.resolve({
      id,
      getState: () => Promise.resolve(meta.state),
      progress: () => meta.progress,
      returnvalue: meta.result,
      failedReason: meta.failedReason,
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0 || !this.processor) return;

    this.isProcessing = true;
    const job = this.queue.shift();
    const meta = this.jobs.get(job.id);

    if (meta) meta.state = 'active';

    // Attach progress updater to job object so workers can call job.progress(n)
    job.progress = (pct) => {
      if (meta) meta.progress = pct;
    };

    try {
      logger.info(`Processing job from ${this.name}`, { id: job.id });
      const result = await this.processor(job);
      if (meta) { meta.state = 'completed'; meta.result = result; }
      logger.info(`Job completed in ${this.name}`, { id: job.id });
    } catch (error) {
      logger.error(`Job failed in ${this.name}`, { id: job.id, error: error.message });
      if (meta) { meta.state = 'failed'; meta.failedReason = error.message; }
      // Basic retry
      if (!job.opts.attempt) job.opts.attempt = 1;
      if (job.opts.attempt < (job.opts.attempts || 3)) {
        job.opts.attempt += 1;
        if (meta) meta.state = 'waiting';
        this.queue.push(job);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }

  /**
   * QUAL-10: Wait for current job to finish before shutdown.
   */
  waitForIdle() {
    return new Promise((resolve) => {
      if (!this.isProcessing) return resolve();
      const check = setInterval(() => {
        if (!this.isProcessing) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }
}

const syncQueue = new InMemoryQueue('github-sync');
module.exports = { syncQueue };
