const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster || cluster.isPrimary) {
  const numWorkers = process.env.WEB_CONCURRENCY || os.cpus().length;

  console.log(`🚀 Master process ${process.pid} - Starting ${numWorkers} workers`);

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // Track worker restarts
  let restartCount = 0;
  const maxRestarts = 10;
  const restartWindow = 60000; // 1 minute

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died (${signal || code})`);

    restartCount++;

    // Prevent infinite restart loop (crash loop)
    if (restartCount > maxRestarts) {
      console.error(`❌ Too many worker restarts (${maxRestarts} in ${restartWindow}ms). Shutting down.`);
      process.exit(1);
    }

    // Reset restart counter after window
    setTimeout(() => {
      restartCount = Math.max(0, restartCount - 1);
    }, restartWindow);

    // Fork new worker
    console.log('🔄 Starting new worker...');
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down workers gracefully...');

    for (const id in cluster.workers) {
      cluster.workers[id].send('shutdown');
      cluster.workers[id].disconnect();

      setTimeout(() => {
        if (cluster.workers[id]) {
          cluster.workers[id].kill();
        }
      }, 10000); // Force kill after 10s
    }
  });

} else {
  // Worker process - load the actual app
  require('./index.js');

  // Handle shutdown message from master
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`🛑 Worker ${process.pid} shutting down...`);

      // Close server gracefully
      if (global.server) {
        global.server.close(() => {
          console.log(`✅ Worker ${process.pid} closed all connections`);
          process.exit(0);
        });

        // Force exit after 10s
        setTimeout(() => {
          console.log(`⚠️ Worker ${process.pid} forcing shutdown`);
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    }
  });
}
