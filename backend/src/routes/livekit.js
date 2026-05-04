import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';

const router = Router();

/**
 * POST /api/livekit/token
 *
 * Generates a LiveKit access token for the authenticated user
 * to join a voice support room. The token grants permission to
 * publish and subscribe to audio in a unique room.
 */
router.post('/token', async (req, res) => {
  try {
    const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      console.error('LiveKit environment variables not configured');
      return res.status(500).json({ error: 'Voice support is not configured.' });
    }

    // Create a unique room name for this support session
    const roomName = `support-${req.user.id}-${Date.now()}`;
    const participantName = req.user.name || 'Customer';
    const participantIdentity = `user-${req.user.id}`;

    // Create an access token with audio permissions
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: '10m', // Token valid for 10 minutes
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: LIVEKIT_URL,
      roomName,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ error: 'Failed to generate voice support token.' });
  }
});

export default router;
