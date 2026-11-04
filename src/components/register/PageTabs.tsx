import { cn } from "@/lib/utils";

/** Tabs along the top of a page (same look as Hosts & Spaces). */
export default function PageTabs<T extends string>({ tabs, value, onChange }: { tabs: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13.5px]", value === k ? "border-plum font-semibold text-plum" : "border-transparent text-nc-muted hover:text-nc-dark")}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function RegisterHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-[26px] text-nc-dark">{title}</h2>
      <p className="mt-1 max-w-3xl text-[13.5px] text-nc-muted">{children}</p>
    </div>
  );
}
