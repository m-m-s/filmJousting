import { Router } from 'express';

const router = Router();

const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;

// A public POST endpoint gets found by bots, so: a hidden field real people
// never fill in, and a cap on how often one address can post. In memory, so it
// resets whenever Render restarts — fine for a form nobody should be hammering.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  recent.set(ip, hits);
  // Without this the map grows for every IP that ever posts.
  if (recent.size > 500) {
    for (const [key, times] of recent) {
      if (times.every(t => now - t >= WINDOW_MS)) recent.delete(key);
    }
  }
  return false;
}

router.post('/', async (req, res) => {
  const { message, contact, website } = req.body ?? {};

  // Honeypot: answer as though it worked so a bot has nothing to learn.
  if (typeof website === 'string' && website.trim().length > 0) {
    res.json({ ok: true });
    return;
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: { code: 'CONTACT_MISSING_MESSAGE', message: 'A message is required' } });
    return;
  }
  if (message.length > MAX_MESSAGE || (typeof contact === 'string' && contact.length > MAX_CONTACT)) {
    res.status(400).json({ error: { code: 'CONTACT_TOO_LONG', message: 'Message or contact details too long' } });
    return;
  }
  if (rateLimited(req.ip ?? 'unknown')) {
    res.status(429).json({ error: { code: 'CONTACT_RATE_LIMITED', message: 'Too many messages from this address' } });
    return;
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error('[CONTACT_FAILED] DISCORD_WEBHOOK_URL is not set');
    res.status(500).json({ error: { code: 'CONTACT_FAILED', message: 'Contact form is not configured' } });
    return;
  }

  const from = typeof contact === 'string' && contact.trim() ? contact.trim() : 'no reply address given';
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // allowed_mentions none: a message containing @everyone shouldn't ping.
      body: JSON.stringify({
        content: `**Film Jousting — new message**\nFrom: ${from}\n\n${message.trim()}`.slice(0, 1900),
        allowed_mentions: { parse: [] },
      }),
    });
    if (!response.ok) {
      console.error(`[CONTACT_FAILED] Discord returned ${response.status}`);
      res.status(502).json({ error: { code: 'CONTACT_FAILED', message: 'Could not deliver the message' } });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[CONTACT_FAILED] Could not reach Discord:', error);
    res.status(502).json({ error: { code: 'CONTACT_FAILED', message: 'Could not deliver the message' } });
  }
});

export default router;
