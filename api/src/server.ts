import './env.js';
import { env } from './env.js';
import { createApp } from './app.js';
import { startEmailScheduler } from './email/scheduler.js';

const app = createApp();
const scheduler = startEmailScheduler();

const server = app.listen(env.port, () => {
  console.log(`✦ Shraddha Garden API listening on http://localhost:${env.port}`);
});

function shutdown(signal: string): void {
  console.log(`[server] ${signal} received — draining connections…`);
  clearInterval(scheduler);
  server.close(() => process.exit(0));
  // If in-flight requests refuse to finish, exit hard rather than hang forever.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));