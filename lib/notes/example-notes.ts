import type { CreateNoteInput } from "@/lib/notes/types";

export const exampleNoteSeeds: ReadonlyArray<Required<CreateNoteInput>> = [
  {
    title: "Welcome to Notes",
    content: `# Welcome to Notes

Start writing your thoughts here...

## Getting Started

This is a markdown editor. You can use:

- **Bold text** with double asterisks
- *Italic text* with single asterisks
- Headings with hash symbols (#, ##, ###, etc.)
- Lists with dashes or asterisks
- Code blocks with triple backticks

## Tips

> Write your notes in markdown format for better organization and formatting.

Happy note-taking!`,
  },
  {
    title: "Todo List",
    content: `# Todo List

## Today's Tasks

- [ ] Review project proposal
- [ ] Update documentation
- [ ] Schedule team meeting
- [x] Complete code review
- [x] Deploy to staging

## This Week

- [ ] Prepare presentation slides
- [ ] Write blog post
- [ ] Update dependencies

## Notes

Remember to follow up on the client feedback from last week.`,
  },
  {
    title: "Meeting Notes - Project Planning",
    content: `# Meeting Notes - Project Planning

**Date:** Today
**Attendees:** Team Lead, Developers, Designers

## Agenda

1. Project timeline review
2. Resource allocation
3. Technical decisions

## Discussion Points

### Timeline
- Phase 1: Complete by end of month
- Phase 2: Start next quarter

### Decisions Made
- Use React for frontend
- Implement new design system
- Schedule weekly sync meetings

## Action Items

- [ ] Create project timeline document
- [ ] Set up development environment
- [ ] Schedule design review session`,
  },
  {
    title: "Project Ideas",
    content: `# Project Ideas

## Web App Concepts

### Note-Taking App
A minimalist note-taking application with markdown support and cloud sync.

**Features:**
- Real-time collaboration
- Tag system
- Search functionality

### Task Manager
A simple but powerful task management tool with kanban boards.

**Tech Stack:**
- Next.js
- TypeScript
- Tailwind CSS

## Learning Goals

- Master React Server Components
- Learn advanced TypeScript patterns
- Explore new CSS features`,
  },
  {
    title: "Code Snippets",
    content: `# Code Snippets

## Useful Functions

\`\`\`typescript
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
\`\`\`

## API Example

\`\`\`typescript
async function fetchUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

## Notes

Remember to add error handling and type safety to all API calls.`,
  },
  {
    title: "Daily Journal",
    content: `# Daily Journal

## Today's Reflection

Today was productive! I made good progress on the project and learned a few new things about React.

### What Went Well
- Completed the main feature ahead of schedule
- Had a great brainstorming session with the team
- Fixed that annoying bug that was blocking progress

### Challenges
- Struggled with a complex state management issue
- Need to improve my time estimation skills

### Tomorrow's Focus
- Continue working on the new feature
- Review pull requests
- Plan next sprint

> "The only way to do great work is to love what you do." - Steve Jobs`,
  },
];
