"use client";

import type { ForwardedRef } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";

import { cn } from "@/lib/utils";

export default function InitializedMDXEditor({
  editorRef,
  className,
  contentEditableClassName,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      {...props}
      className={cn("min-h-full bg-card text-card-foreground", className)}
      contentEditableClassName={cn(
        "prose prose-neutral min-h-64 max-w-none px-5 py-5 text-sm focus-visible:outline-none md:px-7 md:py-6",
        contentEditableClassName
      )}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <CreateLink />
            </>
          ),
          toolbarClassName:
            "flex flex-wrap gap-0.5 rounded-none! border-b border-border bg-muted/30! px-2 py-1",
        }),
      ]}
      ref={editorRef}
    />
  );
}
