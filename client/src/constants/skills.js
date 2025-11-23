export const SKILL_OPTIONS = [
  { category: 'Engineering', title: 'React.js' },
  { category: 'Engineering', title: 'Node.js' },
  { category: 'Engineering', title: 'Python' },
  { category: 'Engineering', title: 'Java' },
  { category: 'Engineering', title: 'DevOps' },
  { category: 'Product', title: 'Product Strategy' },
  { category: 'Product', title: 'User Research' },
  { category: 'Product', title: 'Agile/Scrum' },
  { category: 'Design', title: 'Figma' },
  { category: 'Design', title: 'UI/UX' },
  { category: 'Sales', title: 'B2B Sales' },
  { category: 'Sales', title: 'Account Management' },
  { category: 'Sales', title: 'Negotiation' },
  { category: 'Marketing', title: 'Content Marketing' },
  { category: 'Marketing', title: 'SEO/SEM' },
  { category: 'Soft Skills', title: 'Leadership' },
  { category: 'Soft Skills', title: 'Communication' },
  { category: 'Soft Skills', title: 'Problem Solving' },
];

// Helper to simulate "scoring" based on tags for the Radar Chart
// In a real app, this would come from assessment scores.
export const calculateRadarData = (tags = []) => {
  const scores = {
    Engineering: 30,
    Product: 30,
    Design: 30,
    Sales: 30,
    Marketing: 30,
    'Soft Skills': 50 // Base score
  };

  tags.forEach(tag => {
    const skill = SKILL_OPTIONS.find(s => s.title === tag);
    if (skill) {
      scores[skill.category] = Math.min((scores[skill.category] || 0) + 20, 100);
    }
  });

  return Object.keys(scores).map(key => ({
    subject: key,
    A: scores[key],
    fullMark: 100
  }));
};
