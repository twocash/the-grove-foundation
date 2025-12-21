import fs from 'fs';
try {
  const data = JSON.parse(fs.readFileSync('data/narratives.json', 'utf-8'));
  console.log('✓ JSON valid');
  console.log('Journeys:', Object.keys(data.journeys).join(', '));
  console.log('Total nodes:', Object.keys(data.nodes).length);
  
  // Count nodes per journey
  const journeyCounts = {};
  for (const [id, node] of Object.entries(data.nodes)) {
    const j = node.journeyId || 'unknown';
    journeyCounts[j] = (journeyCounts[j] || 0) + 1;
  }
  console.log('Nodes per journey:', JSON.stringify(journeyCounts, null, 2));
} catch (e) {
  console.error('✗ JSON invalid:', e.message);
}
