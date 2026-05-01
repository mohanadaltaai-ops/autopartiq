import Anthropic from '@anthropic-ai/sdk';

export async function identifyPart(req, res) {
  const problem = req.body.problem;
  if (!problem) return res.status(400).json({ message: 'Problem description is required' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      partName: 'Brake Pads',
      description: 'Demo fallback: the described symptom may be related to worn brake pads. Configure ANTHROPIC_API_KEY for live AI results.',
      partNumberFormat: 'OEM-BRAKE-PAD-XXXX',
      demo: true
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `A customer has a car problem described as: '${problem}'. Identify the most likely spare part needed. Return strict JSON with keys: partName, description, partNumberFormat. Be concise.`;
  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });
  const text = result.content?.[0]?.text || '{}';
  try {
    res.json(JSON.parse(text));
  } catch {
    res.json({ partName: 'AI Suggested Part', description: text.slice(0, 300), partNumberFormat: 'See supplier/OEM catalog' });
  }
}
