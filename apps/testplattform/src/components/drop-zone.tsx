"use client";

import { useRef, useState } from "react";

type Props = {
  /** Form-Feld-Name unter dem die Files gepostet werden */
  name: string;
  /** MIME-Filter (z.B. "image/*" oder ".pdf,.jpg") */
  accept?: string;
  /** Mehrere Dateien erlaubt */
  multiple?: boolean;
  required?: boolean;
  /** Darstellung im Ruhezustand */
  hint?: string;
  /** Sub-Hint, z.B. "JPG, PNG, PDF bis 10 MB" */
  subHint?: string;
  /** Falls die Komponente in einem Form mit anderen Inputs lebt */
  className?: string;
};

export function DropZone({
  name,
  accept,
  multiple = true,
  required,
  hint = "Dateien hierher ziehen oder klicken zum Auswählen",
  subHint,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function handleSelect(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(multiple ? [...files, ...arr] : arr.slice(0, 1));
    if (inputRef.current) {
      const dt = new DataTransfer();
      const merged = multiple ? [...files, ...arr] : arr.slice(0, 1);
      merged.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    if (inputRef.current) {
      const dt = new DataTransfer();
      next.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleSelect(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          drag
            ? "border-ziegler-accent bg-amber-50"
            : "border-neutral-300 bg-neutral-50 hover:border-ziegler-accent hover:bg-neutral-100"
        }`}
      >
        <div className="text-3xl text-neutral-400 group-hover:text-ziegler-accent">
          ⬇
        </div>
        <div className="mt-2 text-sm font-medium text-neutral-700">{hint}</div>
        {subHint && (
          <div className="mt-1 text-xs text-neutral-500">{subHint}</div>
        )}
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required && files.length === 0}
          onChange={(e) => {
            // setze direkt aus dem nativen File-Picker
            const list = e.currentTarget.files;
            if (!list) return;
            setFiles(multiple ? Array.from(list) : Array.from(list).slice(0, 1));
          }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border bg-white p-2 text-sm">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded px-2 py-1 hover:bg-neutral-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-neutral-400">•</span>
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                aria-label="Entfernen"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
