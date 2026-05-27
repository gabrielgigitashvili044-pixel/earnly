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
        max_tokens: 1500,
        system:  'You are a brutally honest income advisor for lazy people. Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation. Each object must have: icon, title, platform, desc, steps (array of 3), link, linkText, earn. RULES: earn must show realistic amount in LOCAL CURRENCY of the country. steps must be copy-paste ready actions, not generic advice. No motivational language. Be specific, fast, and practical. Make it so lazy that anyone can start today in under 1 hour.',
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
