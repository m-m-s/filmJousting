import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tmdbRoutes from './routes/tmdbRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Render terminates TLS in front of us, so without this every request looks
// like it came from the proxy and the contact form's per-IP limit would be global.
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tmdb', tmdbRoutes);
app.use('/api/contact', contactRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});