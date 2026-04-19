const logger = require('../utils/logger');
// Mocking Bull queue completely in-memory
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.queue = [];
    this.processor = null;
    this.isProcessing = false;
  }

  process(concurrency, fn) {
    if (typeof concurrency === 'function') {
      this.processor = concurrency;
    } else {
      this.processor = fn;
    }
  }

  async add(name, data, opts) {
    // If no name is provided, first argument is data
    if (typeof name === 'object') {
      this.queue.push({ name: 'default', data: name, opts });
    } else {
      this.queue.push({ name, data, opts });
    }
    logger.info(`Job added to ${this.name} queue`, { name });
    
    // Trigger processing asynchronously
    setTimeout(() => this.processNext(), 100);
    return { id: Date.now().toString() };
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0 || !this.processor) return;
    
    this.isProcessing = true;
    const job = this.queue.shift();
    
    try {
      logger.info(`Processing job from ${this.name}`);
      await this.processor(job);
      logger.info(`Job completed in ${this.name}`);
    } catch (error) {
      logger.error(`Job failed in ${this.name}`, { error: error.message });
      // Very basic retry logic
      if (!job.opts?.attempt) job.opts = { ...job.opts, attempt: 1 };
      if (job.opts.attempt < (job.opts.attempts || 3)) {
        job.opts.attempt += 1;
        this.queue.push(job);
      }
    } finally {
      this.isProcessing = false;
      // Process next if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }
}

const syncQueue = new InMemoryQueue('github-sync');
module.exports = { syncQueue };
