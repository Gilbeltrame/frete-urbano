// jobManager.mjs
// Sistema de gerenciamento de jobs assíncronos

import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createConciliacaoWorker } from './conciliacaoWorker.mjs';

class JobManager extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map(); // jobId -> job info
    this.activeWorkers = new Map(); // jobId -> worker
  }

  // Criar novo job de conciliação
  createConciliacaoJob(filePath, options = {}) {
    const jobId = uuidv4();
    
    const job = {
      id: jobId,
      type: 'conciliacao',
      status: 'queued', // queued -> running -> completed/failed
      filePath,
      options,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      progress: {
        step: 'queued',
        processed: 0,
        total: 0,
        percentage: 0,
        message: 'Job criado, aguardando processamento...'
      },
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    
    // Processar imediatamente (pode ser expandido para fila)
    this.processJob(jobId);
    
    return jobId;
  }

  // Processar job
  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.startedAt = new Date();
      this.emit('jobStarted', jobId, job);

      // Criar worker
      const worker = createConciliacaoWorker(job.filePath, job.options);
      this.activeWorkers.set(jobId, worker);

      // Escutar eventos do worker
      worker.on('message', (message) => {
        switch (message.type) {
          case 'progress':
            job.progress = { ...job.progress, ...message.data };
            this.emit('jobProgress', jobId, job.progress);
            break;

          case 'completed':
            job.status = 'completed';
            job.completedAt = new Date();
            job.result = message.data;
            this.activeWorkers.delete(jobId);
            this.emit('jobCompleted', jobId, job);
            break;

          case 'error':
            job.status = 'failed';
            job.completedAt = new Date();
            job.error = message.error;
            this.activeWorkers.delete(jobId);
            this.emit('jobFailed', jobId, job);
            break;
        }

        // Atualizar job no mapa
        this.jobs.set(jobId, job);
      });

      worker.on('error', (error) => {
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = error.message;
        this.activeWorkers.delete(jobId);
        this.emit('jobFailed', jobId, job);
        this.jobs.set(jobId, job);
      });

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      this.jobs.set(jobId, job);
      this.emit('jobFailed', jobId, job);
    }
  }

  // Obter status do job
  getJobStatus(jobId) {
    return this.jobs.get(jobId);
  }

  // Listar todos os jobs
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  // Cancelar job
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const worker = this.activeWorkers.get(jobId);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(jobId);
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    this.jobs.set(jobId, job);
    this.emit('jobCancelled', jobId, job);
    
    return true;
  }

  // Limpar jobs antigos (mais de 1 hora)
  cleanupOldJobs() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < oneHourAgo) {
        this.jobs.delete(jobId);
      }
    }
  }

  // Obter estatísticas
  getStats() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      queued: jobs.filter(j => j.status === 'queued').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
      activeWorkers: this.activeWorkers.size
    };
  }
}

// Instância singleton
export const jobManager = new JobManager();

// Limpeza automática a cada hora
setInterval(() => {
  jobManager.cleanupOldJobs();
}, 60 * 60 * 1000);