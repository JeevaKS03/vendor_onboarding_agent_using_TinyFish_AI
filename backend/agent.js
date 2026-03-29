import dotenv from 'dotenv';
import { jobsStore } from './server.js';

dotenv.config();

export async function startAgent(jobId, vendorData) {
    const job = jobsStore[jobId];

    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey) {
        throw new Error("TINYFISH_API_KEY is missing in .env");
    }

    job.logs.push({ timestamp: new Date(), message: "Initializing TinyFish Agent..." });

    const goal = `Navigate to the Indian GST portal (https://reg.gst.gov.in/registration/). You are automating the vendor onboarding process. Proceed to the "New Registration" section for a normal taxpayer. 
    
Use the following details to fill out the form:
- Business Name: ${vendorData.businessName}
- PAN Number: ${vendorData.pan}
- State: ${vendorData.state}
- District: ${vendorData.district}
- Legal Name: ${vendorData.legalName}
- Email: ${vendorData.email}
- Mobile: ${vendorData.phone}

Please navigate the form, fill in these details correctly. If you hit a captcha or limitation, just outline that you have reached the captcha step and stop there successfully.`;

    job.logs.push({ timestamp: new Date(), message: "Sending formulated goal to TinyFish API..." });

    try {
        const response = await fetch('https://agent.tinyfish.ai/v1/automation/run-sse', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://reg.gst.gov.in/registration/',
                goal: goal
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TinyFish API error: ${response.status} - ${errorText}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        job.logs.push({ timestamp: new Date(), message: "Connected to TinyFish stream. Awaiting browser automation events..." });

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (!dataStr || dataStr === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.status === 'error' || parsed.status === 'failed' || parsed.error) {
                            job.status = 'failed';
                            job.error = parsed.error || parsed.message || "Agent encountered an error";
                            job.logs.push({ timestamp: new Date(), message: `Agent Reported Failure: ${job.error}` });
                            continue;
                        }

                        const msg = parsed.message || parsed.action;
                        if (msg) {
                            job.logs.push({
                                timestamp: new Date(),
                                message: msg,
                                raw: parsed
                            });

                        }
                    } catch (e) {
                        job.logs.push({ timestamp: new Date(), message: `Received unparseable event: ${dataStr}` });
                    }
                }
            }
        }

        if (job.status !== 'failed') {
            job.status = 'completed';
            job.logs.push({ timestamp: new Date(), message: "Browser workflow completed." });
        }

    } catch (error) {
        job.status = 'failed';
        job.error = error.message;
        job.logs.push({ timestamp: new Date(), message: `Automation Failed: ${error.message}` });
        throw error;
    }
}
