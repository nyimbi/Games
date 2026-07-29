const SUBJECT_LABELS: Record<string, string> = {
  science: 'Science',
  social_studies: 'Social Studies',
  arts: 'Arts & Culture',
  literature: 'Literature',
  special_area: 'Fun Facts',
};

export function formatSubject(subject: string | undefined | null): string {
  if (!subject) return 'Mixed';
  return SUBJECT_LABELS[subject] ?? subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
