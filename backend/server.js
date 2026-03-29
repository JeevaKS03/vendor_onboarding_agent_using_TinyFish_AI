import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startAgent } from './agent.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

export const jobsStore = {};

app.post('/api/start-onboarding', async (req, res) => {
    const { vendorData } = req.body;
    
    const jobId = Date.now().toString();
    jobsStore[jobId] = {
        status: 'running',
        logs: [],
        data: vendorData,
        error: null
    };

    startAgent(jobId, vendorData).catch(err => {
        console.error("Agent error:", err);
        if (jobsStore[jobId]) {
            jobsStore[jobId].status = 'failed';
            jobsStore[jobId].error = err.message;
            jobsStore[jobId].logs.push({ timestamp: new Date(), message: 'Fatal error: ' + err.message });
        }
    });

    res.json({ jobId, message: 'Onboarding started' });
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobsStore[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ status: job.status, error: job.error });
});

app.get('/api/logs/:jobId', (req, res) => {
    const job = jobsStore[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ logs: job.logs });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
