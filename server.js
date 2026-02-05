const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// In-memory store for prototype
const users = {}; // username -> { trokens, collection: {blookName: count} }
const PACK_COST = 1000;

// Example blooks (id, name, rarityWeight)
const BLOOKS = [
  { id: 'b1', name: 'Red Blob', weight: 60 },
  { id: 'b2', name: 'Blue Blob', weight: 30 },
  { id: 'b3', name: 'Golden Blob', weight: 10 },
];

// Simple pack that can drop any blook
const PACKS = [
  { id: 'starter', name: 'Starter Pack', cost: PACK_COST, pool: BLOOKS }
];

function weightedRandom(pool) {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return pool[pool.length - 1];
}

// Register route: give 1,000,000 trokens
app.post('/register', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  if (users[username]) return res.status(400).json({ error: 'user exists' });
  users[username] = { trokens: 1_000_000, collection: {} };
  return res.json({ username, trokens: users[username].trokens });
});

// Get user (balance & collection)
app.get('/user/:username', (req, res) => {
  const u = users[req.params.username];
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json({ trokens: u.trokens, collection: u.collection });
});

// Open pack
app.post('/open-pack', (req, res) => {
  const { username, packId } = req.body;
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'user not found' });
  const pack = PACKS.find(p => p.id === packId);
  if (!pack) return res.status(404).json({ error: 'pack not found' });
  if (user.trokens < pack.cost) return res.status(400).json({ error: 'insufficient trokens' });

  user.trokens -= pack.cost;
  const drop = weightedRandom(pack.pool);
  user.collection[drop.name] = (user.collection[drop.name] || 0) + 1;

  res.json({
    got: drop,
    trokens: user.trokens,
    collection: user.collection
  });
});

// Simple server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Blokett prototype API running on ${PORT}`));
