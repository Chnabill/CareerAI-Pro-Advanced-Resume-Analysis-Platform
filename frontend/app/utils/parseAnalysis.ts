import type { ResumeScore, CategoryFeedback } from '../types/resume';

export function parseAnalysisText(analysisText: string): {
  scores: ResumeScore;
  categories: CategoryFeedback[];
} {
  // Initialize default scores
  const scores: ResumeScore = {
    atsScore: 0,
    toneStyle: 0,
    content: 0,
    structure: 0,
    skills: 0,
    overall: 0
  };

  const categories: CategoryFeedback[] = [];

  // Extract scores using regex patterns
  const atsMatch = analysisText.match(/ATS\s+(?:Score|Compatibility)[:\s]+(\d+)/i);
  const toneMatch = analysisText.match(/Tone\s+(?:&|and)?\s*Style[:\s]+(\d+)/i);
  const contentMatch = analysisText.match(/Content[:\s]+(\d+)/i);
  const structureMatch = analysisText.match(/Structure[:\s]+(\d+)/i);
  const skillsMatch = analysisText.match(/Skills[:\s]+(\d+)/i);
  const overallMatch = analysisText.match(/Overall\s+Score[:\s]+(\d+)/i);

  if (atsMatch) scores.atsScore = parseInt(atsMatch[1]);
  if (toneMatch) scores.toneStyle = parseInt(toneMatch[1]);
  if (contentMatch) scores.content = parseInt(contentMatch[1]);
  if (structureMatch) scores.structure = parseInt(structureMatch[1]);
  if (skillsMatch) scores.skills = parseInt(skillsMatch[1]);
  if (overallMatch) scores.overall = parseInt(overallMatch[1]);

  // Calculate overall if not provided
  if (scores.overall === 0) {
    const validScores = [
      scores.atsScore,
      scores.toneStyle,
      scores.content,
      scores.structure,
      scores.skills
    ].filter(s => s > 0);
    
    if (validScores.length > 0) {
      scores.overall = Math.round(
        validScores.reduce((sum, s) => sum + s, 0) / validScores.length
      );
    }
  }

  // Parse categories from sections
  const sections = analysisText.split(/\n\d+\.\s+/);
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip intro text
    
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim() || '';
    
    // Try to identify category type
    let category = 'General';
    let score = 0;
    
    if (title.toLowerCase().includes('ats')) {
      category = 'ATS Score';
      score = scores.atsScore;
    } else if (title.toLowerCase().includes('tone') || title.toLowerCase().includes('style')) {
      category = 'Tone & Style';
      score = scores.toneStyle;
    } else if (title.toLowerCase().includes('content')) {
      category = 'Content';
      score = scores.content;
    } else if (title.toLowerCase().includes('structure') || title.toLowerCase().includes('format')) {
      category = 'Structure';
      score = scores.structure;
    } else if (title.toLowerCase().includes('skill')) {
      category = 'Skills';
      score = scores.skills;
    }

    // Extract feedback and suggestions
    const feedback = lines.slice(1).join(' ').trim();
    const suggestions: string[] = [];
    
    // Look for bullet points or suggestions
    const bulletMatches = section.match(/[-•]\s*(.+)/g);
    if (bulletMatches) {
      bulletMatches.forEach(bullet => {
        const cleaned = bullet.replace(/^[-•]\s*/, '').trim();
        if (cleaned) suggestions.push(cleaned);
      });
    }

    if (category !== 'General') {
      categories.push({
        category,
        score,
        feedback: feedback.substring(0, 200), // Limit feedback length
        suggestions: suggestions.slice(0, 5) // Max 5 suggestions
      });
    }
  });

  // If no categories were parsed, create default ones
  if (categories.length === 0) {
    const defaultCategories = [
      { name: 'ATS Score', score: scores.atsScore },
      { name: 'Tone & Style', score: scores.toneStyle },
      { name: 'Content', score: scores.content },
      { name: 'Structure', score: scores.structure },
      { name: 'Skills', score: scores.skills }
    ];

    defaultCategories.forEach(cat => {
      categories.push({
        category: cat.name,
        score: cat.score,
        feedback: 'Analysis in progress. Full details available in the complete report.',
        suggestions: []
      });
    });
  }

  return { scores, categories };
}
