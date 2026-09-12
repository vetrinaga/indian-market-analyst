'use client'

import { BellRing, Bookmark, LayoutDashboard, NotebookPen, PieChart, Radar, Scale, ShieldCheck } from 'lucide-react'

export type WorkspaceSection = 'overview' | 'radar' | 'tax' | 'journal' | 'alerts' | 'portfolio' | 'insurance' | 'saved'

type Item = { id: WorkspaceSection; label: string; hint: string; icon: typeof Radar }

const groups: { heading: string; items: Item[] }[] = [
  {
    heading: 'Research',
    items: [
      { id: 'overview', label: 'Wealth overview', hint: 'Net worth and goals', icon: LayoutDashboard },
      { id: 'radar', label: 'Growth radar', hint: 'Screen equities and bonds', icon: Radar },
      { id: 'saved', label: 'Saved scans', hint: 'Snapshots you kept', icon: Bookmark },
    ],
  },
  {
    heading: 'Portfolio',
    items: [
      { id: 'portfolio', label: 'Portfolio import', hint: 'Holdings X-ray', icon: PieChart },
      { id: 'tax', label: 'Tax & rebalancing', hint: 'Events and allocation', icon: Scale },
      { id: 'journal', label: 'Decision journal', hint: 'Thesis and replay', icon: NotebookPen },
    ],
  },
  {
    heading: 'Monitoring',
    items: [
      { id: 'alerts', label: 'Alerts & reports', hint: 'Weekly review queue', icon: BellRing },
      { id: 'insurance', label: 'Insurance review', hint: 'Cover and gaps', icon: ShieldCheck },
    ],
  },
]

const flat = groups.flatMap(group => group.items)

export function WorkspaceNav({ active, onSelect }: { active: WorkspaceSection; onSelect: (id: WorkspaceSection) => void }) {
  return (
    <>
      <nav aria-label="Workspace sections" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
        {flat.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={active === id ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${active === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <nav aria-label="Workspace sections" className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-[4.75rem] flex flex-col gap-6 rounded-2xl border border-border bg-card/70 p-3">
          {groups.map(group => (
            <div key={group.heading} className="flex flex-col gap-1">
              <div className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{group.heading}</div>
              {group.items.map(({ id, label, hint, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-current={active === id ? 'page' : undefined}
                  className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left ${active === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{label}</span>
                    <span className={`mt-0.5 block truncate text-[10px] ${active === id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
