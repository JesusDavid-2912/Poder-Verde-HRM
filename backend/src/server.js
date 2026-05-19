import 'dotenv/config';
import { createApp } from './app.js';
import { waitForDatabase } from './config/db.js';

const app = createApp();
const port = Number(process.env.PORT || 4000);

async function start() {
  await waitForDatabase();
  app.listen(port, () => {
    console.log(`Poder Verde HRM API en http://0.0.0.0:${port}`);
  });
}

start().catch((e) => {
  console.error('Error al arrancar el servidor:', e);
});
