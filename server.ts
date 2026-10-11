import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';

interface WorkerEvent {
  type: 'click' | 'presence' | 'meltdown' | 'heartbeat' | 'glitch';
  workerId: string;
  stage: number;
  chaos: number;
  location?: string;
  timestamp: number;
}

interface WorkerTelemetry {
  workerId: string;
  stage: number;
  chaos: number;
  lastSeen: number;
  location: string;
}

const PORT = 3000;
const LOCATIONS = [
  'Sector 7-G (Frankfurt)',
  'Sub-Level 04 (London)',
  'Station A (Zurich)',
  'Block 101 (Tokyo)',
  'Observation Post 9 (Denver)',
  'Archive Vault (Singapore)',
  'Terminal 88 (Reykjavik)',
  'Ministry Data Hub (Sydney)'
];

const connectedWorkers = new Map<string, WorkerTelemetry>();
let totalGlobalClicks = 1420;
let hiveChaosAverage = 0;

function getRandomLocation() {
  return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/panopticon') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      socket.destroy();
    }
  });

  app.use(express.json());

  // Broadcast to all active sockets
  function broadcast(msg: object) {
    const payload = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Periodic simulated workers to maintain ambient panopticon feeling if single player
  setInterval(() => {
    if (wss.clients.size > 0) {
      const simulatedId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomChaos = Math.floor(Math.random() * 85);
      const randomEvent: WorkerEvent = {
        type: Math.random() > 0.6 ? 'click' : 'heartbeat',
        workerId: simulatedId,
        stage: Math.min(5, Math.floor(randomChaos / 20)),
        chaos: randomChaos,
        location: getRandomLocation(),
        timestamp: Date.now()
      };

      totalGlobalClicks += 1;
      broadcast({
        type: 'TELEMETRY_PULSE',
        event: randomEvent,
        globalStats: {
          onlineWorkers: Math.max(wss.clients.size, 14 + Math.floor(Math.random() * 6)),
          totalClicks: totalGlobalClicks,
          hiveChaos: Math.round(hiveChaosAverage || 24 + Math.random() * 10)
        }
      });
    }
  }, 4500);

  wss.on('connection', (ws) => {
    const workerId = `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
    const location = getRandomLocation();
    connectedWorkers.set(workerId, {
      workerId,
      stage: 0,
      chaos: 0,
      lastSeen: Date.now(),
      location
    });

    // Send initial welcome & registration
    ws.send(JSON.stringify({
      type: 'INIT_PANOPTICON',
      workerId,
      location,
      globalStats: {
        onlineWorkers: Math.max(wss.clients.size, 18),
        totalClicks: totalGlobalClicks,
        hiveChaos: Math.round(hiveChaosAverage || 22)
      }
    }));

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'WORKER_ACTION') {
          totalGlobalClicks += 1;
          const current = connectedWorkers.get(workerId);
          if (current) {
            current.chaos = parsed.chaos ?? current.chaos;
            current.stage = parsed.stage ?? current.stage;
            current.lastSeen = Date.now();
          }

          // Recalculate average
          let sum = 0;
          connectedWorkers.forEach(w => { sum += w.chaos; });
          hiveChaosAverage = Math.round(sum / Math.max(1, connectedWorkers.size));

          broadcast({
            type: 'TELEMETRY_EVENT',
            event: {
              type: parsed.action || 'click',
              workerId,
              stage: parsed.stage,
              chaos: parsed.chaos,
              location,
              timestamp: Date.now()
            },
            globalStats: {
              onlineWorkers: Math.max(wss.clients.size, 18),
              totalClicks: totalGlobalClicks,
              hiveChaos: hiveChaosAverage
            }
          });
        }
      } catch (err) {
        // Safe json parse handling
      }
    });

    ws.on('close', () => {
      connectedWorkers.delete(workerId);
    });
  });

  const frozenWorkers = new Set<string>();

  // REST API status endpoint
  app.get('/api/panopticon/status', (_req, res) => {
    res.json({
      online: true,
      workers: connectedWorkers.size,
      frozenWorkers: Math.max(frozenWorkers.size, 4),
      totalClicks: totalGlobalClicks,
      hiveChaos: hiveChaosAverage
    });
  });

  app.post('/api/panopticon/action', (req, res) => {
    const { action, stage, chaos, workerId } = req.body || {};
    totalGlobalClicks += 1;
    if (typeof chaos === 'number') {
      hiveChaosAverage = Math.round((hiveChaosAverage * 9 + chaos) / 10);
    }

    const effectiveWorker = workerId || `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
    if (action === 'puzzle_started') {
      frozenWorkers.add(effectiveWorker);
    } else if (action === 'puzzle_solved' || action === 'boss_defeated') {
      frozenWorkers.delete(effectiveWorker);
    }

    broadcast({
      type: 'TELEMETRY_EVENT',
      event: {
        type: action || 'click',
        workerId: effectiveWorker,
        stage: stage || 0,
        chaos: chaos || 0,
        location: getRandomLocation(),
        timestamp: Date.now()
      },
      globalStats: {
        onlineWorkers: Math.max(wss.clients.size, 18),
        frozenWorkers: Math.max(frozenWorkers.size, 3),
        totalClicks: totalGlobalClicks,
        hiveChaos: hiveChaosAverage
      }
    });
    res.json({
      success: true,
      totalClicks: totalGlobalClicks,
      frozenWorkers: Math.max(frozenWorkers.size, 3)
    });
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Panopticon Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
});
