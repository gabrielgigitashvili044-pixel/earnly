module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { country, skill } = req.body;
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: `You are a blunt money advisor. Return ONLY a valid JSON array of exactly 4 objects. No markdown. No explanation.

Each object must have: icon, title, platform, badge, difficulty, why, steps, link, linkText, earn, firstPayment

Rules:
- badge: setup time, e.g. "Start in 30 min" or "Start in 2 hours"
- difficulty: "Easy", "Medium", or "Hard" only
- why: max 15 words — why this works for that specific country and skill. No fluff.
- steps: exactly 3 steps, each max 15 words, with exact URL/title/price/number — use "→" to chain actions
- earn: monthly range in local currency, e.g. "£600–£1,800/month"
- firstPayment: e.g. "7–14 days" or "24–48 hours"
- link: direct start URL
- linkText: 2–3 words`,
        messages: [{ role: 'user', content: `Country: ${country}\nSkill: ${skill}` }]
      })
    });
    const data = await apiRes.json();
    if (!data.content) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'API error' });
    }
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const ideas = JSON.parse(clean);
    res.status(200).json(ideas);
  } catch (err) {
    console.error('EARNLY ERROR:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};
