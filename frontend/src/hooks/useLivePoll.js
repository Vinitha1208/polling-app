import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export const useLivePoll = (pollId) => {
  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // Fallback REST fetch to ensure initial data is always loaded
  const fetchPollDetails = useCallback(async () => {
    if (!pollId) return;
    try {
      const data = await api.getPollResults(pollId);
      setPollData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch poll results via REST:', err);
      setError(err.message || 'Failed to load poll results');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  const connectWebSocket = useCallback(() => {
    if (!pollId) return;

    // Determine WS protocol and host
    let wsUrl;
    if (import.meta.env.VITE_BACKEND_URL) {
      const backendWs = import.meta.env.VITE_BACKEND_URL.replace(/^http/i, 'ws').replace(/\/$/, '');
      wsUrl = `${backendWs}/api/polls/${pollId}/live`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/api/polls/${pollId}/live`;
    }

    console.log(`[WS] Connecting to ${wsUrl}...`);
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WS] Connected successfully to poll ${pollId}`);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[WS] Received live message:', payload);

          if (payload.event === 'VOTE_UPDATED' || payload.event === 'INITIAL_STATE') {
            setPollData((prev) => {
              if (!prev) {
                return {
                  poll_id: payload.poll_id,
                  status: payload.status,
                  total_votes: payload.total_votes,
                  options: payload.options,
                };
              }
              return {
                ...prev,
                status: payload.status || prev.status,
                total_votes: payload.total_votes,
                options: payload.options,
              };
            });
          } else if (payload.event === 'POLL_STATUS_CHANGED') {
            setPollData((prev) => prev ? { ...prev, status: payload.status } : null);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error on socket:', err);
      };

      ws.onclose = (e) => {
        console.log(`[WS] Connection closed: code=${e.code}`);
        setConnectionStatus('disconnected');

        // Exponential backoff reconnect
        if (reconnectAttempts.current < 8) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 10000);
          reconnectAttempts.current += 1;
          console.log(`[WS] Will attempt reconnect in ${delay}ms (Attempt ${reconnectAttempts.current})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch (err) {
      console.error('[WS] Socket creation failed:', err);
      setConnectionStatus('disconnected');
    }
  }, [pollId]);

  useEffect(() => {
    fetchPollDetails();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchPollDetails, connectWebSocket]);

  return {
    pollData,
    loading,
    error,
    connectionStatus,
    refresh: fetchPollDetails,
  };
};
