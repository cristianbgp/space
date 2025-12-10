"use client";

import { MDXEditor } from "@/components/mdx-editor";
import { Suspense, useRef, useState } from "react";
import { FileText, PlusIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { type MDXEditorMethods } from "@mdxeditor/editor";

export interface Note {
  id: string;
  title: string;
  content: string;
}

export const exampleNotes: Note[] = [
  {
    id: "welcome",
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
    id: "todo",
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
    id: "meeting",
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
    id: "ideas",
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
    id: "code",
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
    id: "journal",
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

export function NotesApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    exampleNotes[0].id
  );
  const mdxEditorRef = useRef<MDXEditorMethods>(null);

  const selectedNote = exampleNotes.find((note) => note.id === selectedNoteId);

  return (
    <div className="flex w-full min-h-full">
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon" className="sticky top-0 h-full bg-red-300">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className=" border"
                      variant="outline"
                      onClick={() => {
                        setSelectedNoteId("new");
                        mdxEditorRef.current?.setMarkdown("");
                      }}
                    >
                      <PlusIcon />
                      <span>New Note</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {exampleNotes.map((note) => (
                    <SidebarMenuItem key={note.id}>
                      <SidebarMenuButton
                        isActive={selectedNoteId === note.id}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          mdxEditorRef.current?.setMarkdown(note.content);
                        }}
                      >
                        <FileText />
                        <span>{note.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-12 rounded-none backdrop-blur-md bg-background/0 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <span className="text-sm font-medium">
              {selectedNote?.title || ""}
            </span>
          </header>
          <div className="flex flex-col p-4">
            <Suspense>
              <MDXEditor
                ref={mdxEditorRef}
                markdown={selectedNote?.content || ""}
              />
            </Suspense>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
