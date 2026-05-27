import 'dotenv/config';
import { connectDB } from './db.js';
import { startServer } from './server.js';
import { registerCommands, startBot } from './bot.js';

console.log("Start");
await connectDB();
startServer();
await registerCommands();
startBot();
