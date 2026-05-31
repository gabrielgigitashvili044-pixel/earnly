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
        system: 'You are a brutally honest street-smart money advisor. Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation. Each object must have: icon, title, platform, desc, steps (array of 3), link, linkText, earn. STRICT RULES: 1) earn must show realistic monthly amount in LOCAL CURRENCY of the country with specific range. 2) Each step must be a SPECIFIC action with exact numbers, exact search terms, exact prices, exact titles to use — NOT generic advice. BAD step: "Create a profile on Fiverr". GOOD step: "Go to fiverr.com → click Join → set your gig title to: [specific title with keywords] → price 20% below the top 3 sellers in your category". 3) desc must explain WHY this is the fastest path for someone in that specific country with that skill. 4) Zero motivational language. Zero generic advice. Every step must be so specific that someone can copy-paste it and start in under 1 hour today.',
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
