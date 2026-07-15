'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';

export function useQRBridge(memoryId: string | null) {
  const [peerState, setPeerState] = useState<'idle' | 'syncing' | 'authorised'>('idle');
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const { actions } = useStudioState();

  const [isOpticsMuted, setIsOpticsMuted] = useState(false);
  const [isP2PDisabled, setIsP2PDisabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOpticsMuted(localStorage.getItem('privacy_optics_muted') === 'true');

    const handleMuteChange = () => {
      setIsOpticsMuted(localStorage.getItem('privacy_optics_muted') === 'true');
    };
    window.addEventListener('privacy-optics-changed', handleMuteChange);
    return () => window.removeEventListener('privacy-optics-changed', handleMuteChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsP2PDisabled(localStorage.getItem('dev_simulate_webrtc_disconnect') === 'true');

    const handleSimulateChange = () => {
      setIsP2PDisabled(localStorage.getItem('dev_simulate_webrtc_disconnect') === 'true');
    };
    window.addEventListener('dev-p2p-simulation-changed', handleSimulateChange);
    window.addEventListener('storage', handleSimulateChange);
    return () => {
      window.removeEventListener('dev-p2p-simulation-changed', handleSimulateChange);
      window.removeEventListener('storage', handleSimulateChange);
    };
  }, []);

  const [bridgeStatus, setBridgeStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!memoryId || typeof window === 'undefined' || isOpticsMuted || isP2PDisabled) {
      setPeerState('idle');
      setBridgeStatus('disconnected');
      return;
    }

    let isMounted = true;
    let peerInstance: any = null;

    const cleanupReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const initPeer = () => {
      if (!isMounted) return;

      import('peerjs').then(({ Peer }) => {
        if (!isMounted) return;

        const peer = new Peer(`solo-remote-${memoryId}-host`, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          secure: true,
          debug: 3,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        peer.on('open', (id) => {
          if (!isMounted) { peer.destroy(); return; }
          console.log('[useQRBridge] Host Peer open. Syncing...', id);
          setPeerState('syncing');
          setBridgeStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'disconnected');
          reconnectAttemptsRef.current = 0; // reset on successful connection to signaling server
        });

        peer.on('connection', (conn) => {
          if (!isMounted) { conn.close(); return; }
          connRef.current = conn;
          setPeerState('authorised');
          setBridgeStatus('connected');
          reconnectAttemptsRef.current = 0;
          cleanupReconnectTimer();
          console.log('[useQRBridge] Connection established with remote controller.');

          conn.on('data', (data: any) => {
            if (!isMounted) return;
            console.log('[useQRBridge] Tactical command received:', data.type);

            switch (data.type) {
              case 'PLAY_PAUSE':
                actions.toggleScrolling();
                window.dispatchEvent(new CustomEvent('studio-remote-command', { detail: { command: 'PLAY_PAUSE' } }));
                break;
              case 'NEXT_CUE':
                window.dispatchEvent(new Event('studio-next-cue'));
                window.dispatchEvent(new CustomEvent('studio-remote-command', { detail: { command: 'NEXT_CUE' } }));
                break;
              case 'RESTART_TAKE':
                window.dispatchEvent(new Event('studio-restart-take'));
                window.dispatchEvent(new CustomEvent('studio-remote-command', { detail: { command: 'RESTART_TAKE' } }));
                break;
              default:
                console.warn('[useQRBridge] Unknown command type:', data.type);
            }
          });

          conn.on('close', () => {
            if (isMounted) {
              setPeerState('syncing');
              setBridgeStatus('reconnecting');
              connRef.current = null;
              triggerReconnect();
            }
          });
        });

        peer.on('call', (call) => {
          if (!isMounted) { call.close(); return; }
          console.log('[useQRBridge] Incoming remote camera Media Call received...');
          call.answer();

          call.on('stream', (remoteStream) => {
            if (!isMounted) return;
            console.log('[useQRBridge] WebRTC Remote Camera stream received and bound.');
            window.dispatchEvent(new CustomEvent('remote-camera-active', {
              detail: { stream: remoteStream }
            }));
          });
        });

        peer.on('error', (err: any) => {
          console.error('[useQRBridge] PeerJS Error:', err);
          if (err.type === 'peer-unavailable' || err.type === 'network' || err.type === 'socket-error' || err.type === 'socket-closed') {
            setBridgeStatus('reconnecting');
            triggerReconnect();
          }
        });

        peer.on('disconnected', () => {
          console.log('[useQRBridge] Host Peer disconnected from signaling server.');
          setBridgeStatus('reconnecting');
          triggerReconnect();
        });

        const setupHeartbeat = (peerInstance: any) => {
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

          heartbeatIntervalRef.current = setInterval(() => {
            if (peerInstance.destroyed) {
              if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
              }
              return;
            }

            if (peerInstance.disconnected) {
              console.warn('[QRBridge] Peer disconnected. Attempting automatic signaling reconnection...');
              peerInstance.reconnect();
            } else {
              // Send a silent ping connection check through active connections
              Object.values(peerInstance.connections).forEach((connArray: any) => {
                connArray.forEach((conn: any) => {
                  if (conn.open) {
                    conn.send({ type: 'HEARTBEAT', timestamp: Date.now() });
                  }
                });
              });
            }
          }, 5000); // 5-second heartbeats
        };

        setupHeartbeat(peer);

        peerRef.current = peer;
        peerInstance = peer;
      });
    };

    const triggerReconnect = () => {
      if (reconnectAttemptsRef.current >= 5) {
        console.log('[useQRBridge] Max reconnect attempts (5) reached. Giving up.');
        setBridgeStatus('disconnected');
        return;
      }

      cleanupReconnectTimer();
      const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
      console.log(`[useQRBridge] Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1} in ${delay}ms`);

      reconnectTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        reconnectAttemptsRef.current++;
        
        if (peerInstance && !peerInstance.destroyed) {
          if (peerInstance.disconnected) {
            console.log('[useQRBridge] Reconnecting peer to signaling server...');
            peerInstance.reconnect();
          } else {
            console.log('[useQRBridge] Peer is connected but data connection dropped. Resetting peer...');
            peerInstance.destroy();
            initPeer();
          }
        } else {
          console.log('[useQRBridge] Re-instantiating destroyed peer...');
          initPeer();
        }
      }, delay);
    };

    initPeer();

    return () => {
      isMounted = false;
      cleanupReconnectTimer();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, [memoryId, actions, isOpticsMuted, isP2PDisabled]);

  return { peerState, bridgeStatus };
}
