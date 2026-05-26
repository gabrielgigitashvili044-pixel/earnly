export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { country, skill } = req.body;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a realistic income advisor. Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation.
Each object must have:
- "icon": one relevant emoji
- "title": short job title (max 5 words)
- "platform": specific platform name
- "desc": one sentence how to start
- "steps": array of exactly 3 short action steps
- "link": real URL to the platform
- "linkText": button text like "Start on Fiverr"
- "earn": realistic daily earn range in local currency

Be VERY specific to the person's country and skill. Give REAL, actionable advice.`,
      messages: [{ role: 'user', content: `Country: ${country}\nSkill: ${skill}` }]
    })
  });

  const data = await response.json();
  const raw = data.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  const ideas = JSON.parse(clean);
  
  res.status(200).json(ideas);
}
