"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const customers_1 = __importDefault(require("./routes/customers"));
const docks_1 = __importDefault(require("./routes/docks"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/customers', customers_1.default);
app.use('/api/docks', docks_1.default);
app.use('/api/jobs', jobs_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: 'connected' });
});
// Serve static frontend from frontend/dist/
const staticPath = path_1.default.resolve(process.cwd(), 'frontend', 'dist');
app.use(express_1.default.static(staticPath));
// SPA fallback
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(staticPath, 'index.html'));
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
exports.default = app;
