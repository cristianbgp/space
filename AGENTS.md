# Agent Guidelines

## Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Dev: `npm run dev`
- No test framework configured

## Code Style
- Use TypeScript with strict mode enabled
- Import React components with: `import * as React from "react"`
- Use absolute imports with `@/` prefix (configured in tsconfig.json)
- Follow shadcn/ui patterns for components
- Use `cn()` utility for className merging
- Component files use PascalCase (e.g., `Button.tsx`)
- Hook files use camelCase with `use-` prefix (e.g., `use-mobile.ts`)
- Place UI components in `components/ui/`
- Use class-variance-authority (cva) for component variants
- Follow Radix UI patterns for accessible components
- Use Tailwind CSS for styling
- No default exports for functions with multiple exports
- Use proper TypeScript types for all props and returns