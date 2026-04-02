import { useMemo } from "react";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import type { LabelNodeExampleCreatePayload, LabelNodeExampleRecord, LabelNodeExampleUpdatePayload } from "../lib/api";

const EXAMPLE_TYPE_OPTIONS = [
  { value: "positive", label: "positive" },
  { value: "negative", label: "negative" },
  { value: "boundary", label: "boundary" },
  { value: "counter", label: "counter" }
] as const;

type TaxonomyNodeExamplesSectionProps = {
  examplesLoading: boolean;
  exampleSaving: boolean;
  examples: LabelNodeExampleRecord[];
  exampleDraft: LabelNodeExampleCreatePayload;
  editingExampleId: string | null;
  editingExampleDraft: LabelNodeExampleUpdatePayload;
  onExampleDraftChange: (next: LabelNodeExampleCreatePayload) => void;
  onEditingExampleDraftChange: (next: LabelNodeExampleUpdatePayload) => void;
  onAddExample: () => void;
  onStartEditExample: (item: LabelNodeExampleRecord) => void;
  onCancelEditExample: () => void;
  onSaveEditedExample: (exampleId: string) => void;
  onRemoveExample: (exampleId: string) => void;
};

export function TaxonomyNodeExamplesSection({
  examplesLoading,
  exampleSaving,
  examples,
  exampleDraft,
  editingExampleId,
  editingExampleDraft,
  onExampleDraftChange,
  onEditingExampleDraftChange,
  onAddExample,
  onStartEditExample,
  onCancelEditExample,
  onSaveEditedExample,
  onRemoveExample
}: TaxonomyNodeExamplesSectionProps) {
  const groupedExamples = useMemo(() => {
    const groups: Record<string, LabelNodeExampleRecord[]> = {
      positive: [],
      negative: [],
      boundary: [],
      counter: []
    };
    for (const item of examples) {
      const key = item.exampleType;
      if (groups[key]) groups[key].push(item);
    }
    return groups;
  }, [examples]);

  return (
    <div className="space-y-3">
      {examplesLoading ? <p className="text-xs text-textSecondary">Loading examples...</p> : null}

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <p className="mb-2 text-xs text-textSecondary">Add Example</p>
        <div className="grid gap-2 md:grid-cols-[180px_1fr]">
          <Select
            value={exampleDraft.exampleType}
            onChange={(value) => onExampleDraftChange({ ...exampleDraft, exampleType: value as LabelNodeExampleCreatePayload["exampleType"] })}
            options={EXAMPLE_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          />
          <input
            value={exampleDraft.expectedLabel}
            onChange={(event) => onExampleDraftChange({ ...exampleDraft, expectedLabel: event.target.value })}
            placeholder="Expected label (optional)"
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
          />
        </div>
        <div className="mt-2 space-y-2">
          <Textarea
            rows={3}
            value={exampleDraft.content}
            onChange={(event) => onExampleDraftChange({ ...exampleDraft, content: event.target.value })}
            placeholder="Example content..."
          />
          <Textarea rows={2} value={exampleDraft.note} onChange={(event) => onExampleDraftChange({ ...exampleDraft, note: event.target.value })} placeholder="Note..." />
        </div>
        <div className="mt-2">
          <button
            type="button"
            disabled={exampleSaving}
            onClick={onAddExample}
            className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exampleSaving ? "Adding..." : "Add Example"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedExamples).map(([group, rows]) => (
          <div key={group} className="rounded-lg border border-white/10 bg-black/15 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-textSecondary">
              {group} ({rows.length})
            </p>
            {rows.length === 0 ? <p className="text-xs text-textSecondary">No examples.</p> : null}
            <div className="space-y-2">
              {rows.map((item) => (
                <article key={item.id} className="rounded-md border border-white/10 bg-white/[0.02] p-2">
                  {editingExampleId === item.id ? (
                    <div className="space-y-2">
                      <Select
                        value={editingExampleDraft.exampleType}
                        onChange={(value) =>
                          onEditingExampleDraftChange({
                            ...editingExampleDraft,
                            exampleType: value as LabelNodeExampleUpdatePayload["exampleType"]
                          })
                        }
                        options={EXAMPLE_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                      />
                      <Textarea
                        rows={3}
                        value={editingExampleDraft.content}
                        onChange={(event) => onEditingExampleDraftChange({ ...editingExampleDraft, content: event.target.value })}
                      />
                      <input
                        value={editingExampleDraft.expectedLabel}
                        onChange={(event) => onEditingExampleDraftChange({ ...editingExampleDraft, expectedLabel: event.target.value })}
                        placeholder="Expected label"
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
                      />
                      <Textarea
                        rows={2}
                        value={editingExampleDraft.note}
                        onChange={(event) => onEditingExampleDraftChange({ ...editingExampleDraft, note: event.target.value })}
                        placeholder="Note"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={exampleSaving}
                          onClick={() => onSaveEditedExample(item.id)}
                          className="cursor-pointer rounded-md border border-indigo-400/45 px-2 py-1 text-[11px] text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={exampleSaving}
                          onClick={onCancelEditExample}
                          className="cursor-pointer rounded-md border border-white/20 px-2 py-1 text-[11px] text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-textPrimary">{item.content}</p>
                      <p className="mt-1 text-[11px] text-textSecondary">
                        expected: {item.expectedLabel || "-"} | note: {item.note || "-"}
                      </p>
                      <p className="mt-1 text-[11px] text-textSecondary">updated: {item.updatedAt}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onStartEditExample(item)}
                          className="cursor-pointer rounded-md border border-white/20 px-2 py-1 text-[11px] text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={exampleSaving}
                          onClick={() => onRemoveExample(item.id)}
                          className="cursor-pointer rounded-md border border-rose-400/45 px-2 py-1 text-[11px] text-rose-100 transition-colors hover:border-rose-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
