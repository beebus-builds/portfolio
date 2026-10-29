"use client";

import type { PostContent } from "@/lib/postBody";
import PostPreview from "./PostPreview";

/**
 * Draft preview inside a native dialog — a focused look for narrow screens
 * where the editor's live pane sits below the form. All of the rendering is
 * shared with that pane via PostPreview.
 */

type PreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  date: string;
  minutes: string;
  excerpt: string;
  tags: string;
  accent: string;
  variant: number;
  parsed: PostContent;
};

export default function PreviewDialog({ open, onClose, ...preview }: PreviewDialogProps) {
  return (
    <dialog className="editor__preview-dialog" open={open} onClose={onClose}>
      <div className="editor__preview-dialog__panel">
        <button type="button" className="editor__preview-dialog__close" aria-label="Close preview" onClick={onClose}>
          Close
        </button>
        <PostPreview {...preview} />
      </div>
    </dialog>
  );
}
