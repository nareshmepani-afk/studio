'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';

export function useQRBridge(memoryId: string | null) {
  const [peerState, setPeerState] = useState<'idle' | 'syncing' | 'authorised'>('idle');
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const { actions } = useStudioState();

  useEffect(() => {
    if (!memoryId || typeof window === 'undefined') return;

    let isMounted = true;
    let peerInstance: any = null;

    import('peerjs').then(({ Peer }) => {
      if (!isMounted) return;

      const peer = new Peer(`solo-remote-${memoryId}-host`, {
        debug: 1,
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
      });

      peer.on('connection', (conn) => {
        if (!isMounted) { conn.close(); return; }
        connRef.current = conn;
        setPeerState('authorised');
        console.log('[useQRBridge] Connection established with remote controller.');

        conn.on('data', (data: any) => {
          if (!isMounted) return;
          console.log('[useQRBridge] Tactical command received:', data.type);

          switch (data.type) {
            case 'PLAY_PAUSE':
              actions.toggleScrolling();
              break;
            case 'NEXT_CUE':
              // Dispatch event to advance prompter
              window.dispatchEvent(new Event('studio-next-cue'));
              break;
            case 'RESTART_TAKE':
              // Dispatch event to restart active performance take safely
              window.dispatchEvent(new Event('studio-restart-take'));
              break;
            default:
              console.warn('[useQRBridge] Unknown command type:', data.type);
          }
        });

        conn.on('close', () => {
          if (isMounted) {
            setPeerState('syncing');
            connRef.current = null;
          }
        });
      });

      peer.on('error', (err: any) => {
        console.error('[useQRBridge] PeerJS Error:', err);
      });

      peerRef.current = peer;
      peerInstance = peer;
    });

    return () => {
      isMounted = false;
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, [memoryId, actions]);

  return { peerState };
}
