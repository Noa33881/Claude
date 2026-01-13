const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get server info
app.get('/api/server/:serverId', async (req, res) => {
    const { serverId } = req.params;

    // Validate server ID
    if (!serverId || !/^[a-zA-Z0-9]+$/.test(serverId)) {
        return res.status(400).json({
            error: 'Invalid server ID format'
        });
    }

    try {
        // Try multiple FiveM API endpoints
        const endpoints = [
            `https://servers-frontend.fivem.net/api/servers/single/${serverId}`,
            `https://servers-live.fivem.net/api/servers/single/${serverId}`
        ];

        let serverData = null;
        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);

                const response = await axios.get(endpoint, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'FiveM-IP-Finder/2.0',
                        'Accept': 'application/json'
                    }
                });

                if (response.data && response.data.Data) {
                    serverData = response.data;
                    console.log(`Success with endpoint: ${endpoint}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.log(`Failed with endpoint: ${endpoint}`, err.message);
                continue;
            }
        }

        if (!serverData) {
            throw new Error(lastError?.message || 'Server not found in any endpoint');
        }

        // Extract server information
        const data = serverData.Data;
        const endpoint = data.connectEndPoints?.[0] || '';
        const [ip, port] = endpoint.split(':');

        // Extract players list
        const players = [];
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach(player => {
                if (player.name) {
                    players.push({
                        name: player.name,
                        id: player.id || player.identifiers?.[0] || null,
                        ping: player.ping || null
                    });
                }
            });
        }

        const responseData = {
            success: true,
            server: {
                id: serverId,
                name: data.hostname || 'Unknown Server',
                ip: ip || 'Not Found',
                port: port || '30120',
                players: data.clients || 0,
                maxPlayers: data.sv_maxclients || 0,
                connectCommand: `connect ${ip}:${port || '30120'}`,
                endpoint: endpoint
            },
            players: players
        };

        res.json(responseData);

    } catch (error) {
        console.error('Error fetching server data:', error.message);
        res.status(404).json({
            success: false,
            error: 'Server not found or API unavailable',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FiveM IP Finder API running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/server/:serverId`);
    console.log(`🌐 Web interface: http://localhost:${PORT}`);
});
