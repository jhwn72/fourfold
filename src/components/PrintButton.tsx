"use client";

// Opens the browser print dialog so the page can be saved as a PDF. Hidden when printing.
export default function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button type="button" className="no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
