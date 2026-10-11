import { useState, useEffect, useRef, useCallback } from 'react';

export interface PanopticonEvent {
  type: string;
  workerId: string;
  stage: number;
  chaos: number;
  location: string;
  timestamp: number;
}

export interface PanopticonStats {
  onlineWorkers: number;
  frozenWorkers: number;
  totalClicks: number;
  hiveChaos: number;
}

export function usePanopticon(currentStage: number, currentChaos: number) {
  const [stats, setStats] = useState<PanopticonStats>({
    onlineWorkers: 16,
    frozenWorkers: 4,
    totalClicks: 1420,
    hiveChaos: 22
  });
  const [recentEvents, setRecentEvents] = useState<PanopticonEvent[]>([]);
  const [myWorkerId, setMyWorkerId] = useState<string>('WRK-LOCAL');
  const [myLocation, setMyLocation] = useState<string>('Sector 7-G');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/panopticon`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onerror = () => {
        // Suppress websocket connection errors silently in sandboxed environments
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_PANOPTICON') {
            setMyWorkerId(data.workerId);
            setMyLocation(data.location);
            if (data.globalStats) setStats(data.globalStats);
          } else if (data.type === 'TELEMETRY_PULSE' || data.type === 'TELEMETRY_EVENT') {
            if (data.globalStats) setStats(data.globalStats);
            if (data.event) {
              setRecentEvents((prev) => [data.event, ...prev.slice(0, 19)]);
            }
          }
        } catch {
          // ignore parsing error
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore close errors
        }
      }
    };
  }, []);

  const broadcastAction = useCallback(
    (actionType: string = 'click') => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'WORKER_ACTION',
            action: actionType,
            stage: currentStage,
            chaos: currentChaos
          })
        );
      } else {
        // Fallback to REST endpoint
        fetch('/api/panopticon/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            stage: currentStage,
            chaos: currentChaos
          })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.totalClicks) {
              setStats((prev) => ({
                ...prev,
                totalClicks: data.totalClicks
              }));
            }
          })
          .catch(() => {
            // Ignore offline errors
          });
      }
    },
    [currentStage, currentChaos]
  );

  return {
    stats,
    recentEvents,
    myWorkerId,
    myLocation,
    isConnected,
    broadcastAction
  };
}
