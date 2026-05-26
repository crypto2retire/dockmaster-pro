"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const server_1 = __importDefault(require("./server"));
const PORT = process.env.PORT || 3001;
async function start() {
    await (0, db_1.initDatabase)();
    console.log('[DB] Database initialized at', new Date().toISOString());
    server_1.default.listen(PORT, () => {
        console.log(`[API] DockMaster Pro running at http://localhost:${PORT}`);
    });
}
start().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
