import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import {
  RoomContext,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Headset, Mic, MicOff, PhoneOff, X } from 'lucide-react';
import api from '../utils/api';
import './VoiceCallModal.css';

/**
 * VoiceCallModal — Full-screen overlay for live voice calls
 * with the ShopVault AI support agent via LiveKit.
 */
export default function VoiceCallModal({ isOpen, onClose }) {
  const [room] = useState(() => new Room());
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | error
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const connectedRef = useRef(false);

  // Connect to LiveKit room when modal opens
  const connectToRoom = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setErrorMessage('');

      // Get token from our backend
      const data = await api.getLivekitToken();

      // Connect to the room
      await room.connect(data.url, data.token);
      connectedRef.current = true;
      setConnectionState('connected');

      // Start the call timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      console.error('Voice call connection error:', error);
      setConnectionState('error');
      setErrorMessage(
        error.message || 'Failed to connect to voice support. Please try again.'
      );
    }
  }, [room]);

  // Disconnect from room
  const disconnectFromRoom = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (connectedRef.current) {
      await room.disconnect();
      connectedRef.current = false;
    }

    setConnectionState('idle');
    setCallDuration(0);
    setIsMuted(false);
  }, [room]);

  // Connect when modal opens
  useEffect(() => {
    if (isOpen) {
      connectToRoom();
    }

    return () => {
      disconnectFromRoom();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for room disconnection
  useEffect(() => {
    const handleDisconnect = () => {
      setConnectionState('idle');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room]);

  // Toggle microphone
  const toggleMute = async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  // End call
  const handleEndCall = async () => {
    await disconnectFromRoom();
    onClose();
  };

  // Format duration as mm:ss
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="voice-call-overlay" onClick={handleEndCall}>
      <div className="voice-call-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="voice-call-close" onClick={handleEndCall} aria-label="Close">
          <X size={18} />
        </button>

        <RoomContext.Provider value={room}>
          {connectionState === 'connecting' && (
            <ConnectingView />
          )}

          {connectionState === 'connected' && (
            <ConnectedView
              callDuration={callDuration}
              formatDuration={formatDuration}
              isMuted={isMuted}
              toggleMute={toggleMute}
              handleEndCall={handleEndCall}
            />
          )}

          {connectionState === 'error' && (
            <ErrorView
              message={errorMessage}
              onRetry={connectToRoom}
              onClose={handleEndCall}
            />
          )}

          {/* This component plays the agent's audio */}
          <RoomAudioRenderer />
        </RoomContext.Provider>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ConnectingView() {
  return (
    <div className="voice-call-connecting">
      <div className="voice-call-avatar">
        <div className="voice-call-avatar-inner">
          <Headset size={40} />
        </div>
      </div>
      <div className="voice-call-status">
        <h3>Connecting to Support</h3>
        <p>
          <span className="status-dot connecting" />
          Setting up your voice session...
        </p>
      </div>
      <div className="spinner-large" />
    </div>
  );
}

function ConnectedView({ callDuration, formatDuration, isMuted, toggleMute, handleEndCall }) {
  return (
    <>
      <AgentDisplay />

      {/* Call timer */}
      <div className="voice-call-timer">
        {formatDuration(callDuration)}
      </div>

      {/* Controls */}
      <div className="voice-call-controls">
        <button
          className={`voice-call-btn mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          className="voice-call-btn end-btn"
          onClick={handleEndCall}
          aria-label="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </>
  );
}

function AgentDisplay() {
  const { state, audioTrack } = useVoiceAssistant();

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  const getStatusText = () => {
    switch (state) {
      case 'connecting':
        return 'Agent connecting...';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Connected';
    }
  };

  return (
    <>
      {/* Agent avatar with pulse effect */}
      <div className={`voice-call-avatar ${isSpeaking ? 'speaking' : ''}`}>
        <div className="voice-call-avatar-inner">
          <Headset size={40} />
        </div>
      </div>

      {/* Status */}
      <div className="voice-call-status">
        <h3>ShopVault Support</h3>
        <p>
          <span className={`status-dot ${isListening || isSpeaking ? 'connected' : 'connecting'}`} />
          {getStatusText()}
        </p>
      </div>

      {/* Audio visualizer */}
      <div className="voice-call-visualizer">
        {audioTrack && (
          <BarVisualizer
            state={state}
            trackRef={audioTrack}
            barCount={7}
            options={{ minHeight: 4 }}
          />
        )}
      </div>
    </>
  );
}

function ErrorView({ message, onRetry, onClose }) {
  return (
    <>
      <div className="voice-call-avatar">
        <div className="voice-call-avatar-inner">
          <Headset size={40} />
        </div>
      </div>
      <div className="voice-call-error">
        <h3>Connection Failed</h3>
        <p>{message}</p>
        <div className="voice-call-controls">
          <button className="btn btn-primary" onClick={onRetry}>
            Try Again
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
