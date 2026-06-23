"use client";

import { useCallback, useState } from "react";

interface FileDropzoneResult {
  isDragActive: boolean;
  dropHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Pure drag-event plumbing for a dropzone — no validation. Callers keep their
 * existing size/type checks in `onFile` so drag-and-drop and click-to-upload
 * share exactly the same validation path.
 */
export function useFileDropzone(
  onFile: (file: File) => void,
  disabled = false
): FileDropzoneResult {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragActive(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile]
  );

  return { isDragActive, dropHandlers: { onDragOver, onDragLeave, onDrop } };
}
