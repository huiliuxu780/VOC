import { Textarea } from "../components/ui/Textarea";
import type { LabelNodeConfigUpsertPayload } from "../lib/api";

type TaxonomyNodeConfigEditorSectionProps = {
  configLoading: boolean;
  configSaving: boolean;
  configDraft: LabelNodeConfigUpsertPayload;
  currentStatus: LabelNodeConfigUpsertPayload["status"];
  onConfigDraftChange: (next: LabelNodeConfigUpsertPayload) => void;
  onSaveConfig: (status: LabelNodeConfigUpsertPayload["status"]) => void;
};

export function TaxonomyNodeConfigEditorSection({
  configLoading,
  configSaving,
  configDraft,
  currentStatus,
  onConfigDraftChange,
  onSaveConfig
}: TaxonomyNodeConfigEditorSectionProps) {
  function patchConfigDraft(patch: Partial<LabelNodeConfigUpsertPayload>) {
    onConfigDraftChange({
      ...configDraft,
      ...patch
    });
  }

  return (
    <div className="space-y-3">
      {configLoading ? <p className="text-xs text-textSecondary">Loading node config...</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs text-textSecondary">
          <span>Prompt Name</span>
          <input
            value={configDraft.promptName}
            onChange={(event) => patchConfigDraft({ promptName: event.target.value })}
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
          />
        </label>
        <label className="space-y-1 text-xs text-textSecondary">
          <span>Version</span>
          <input
            value={configDraft.version}
            onChange={(event) => patchConfigDraft({ version: event.target.value })}
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
          />
        </label>
      </div>

      <label className="space-y-1 text-xs text-textSecondary">
        <span>Definition</span>
        <Textarea rows={3} value={configDraft.definition} onChange={(event) => patchConfigDraft({ definition: event.target.value })} />
      </label>
      <label className="space-y-1 text-xs text-textSecondary">
        <span>Decision Rule</span>
        <Textarea rows={3} value={configDraft.decisionRule} onChange={(event) => patchConfigDraft({ decisionRule: event.target.value })} />
      </label>
      <label className="space-y-1 text-xs text-textSecondary">
        <span>System Prompt</span>
        <Textarea rows={4} value={configDraft.systemPrompt} onChange={(event) => patchConfigDraft({ systemPrompt: event.target.value })} />
      </label>
      <label className="space-y-1 text-xs text-textSecondary">
        <span>User Prompt Template</span>
        <Textarea rows={3} value={configDraft.userPromptTemplate} onChange={(event) => patchConfigDraft({ userPromptTemplate: event.target.value })} />
      </label>
      <label className="space-y-1 text-xs text-textSecondary">
        <span>Output Schema</span>
        <Textarea rows={3} value={configDraft.outputSchema} onChange={(event) => patchConfigDraft({ outputSchema: event.target.value })} />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={configSaving}
          onClick={() => onSaveConfig("draft")}
          className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {configSaving ? "Saving..." : "Save Config"}
        </button>
        <button
          type="button"
          disabled={configSaving}
          onClick={() => onSaveConfig("published")}
          className="cursor-pointer rounded-lg border border-emerald-400/45 px-3 py-1.5 text-xs text-emerald-100 transition-colors hover:border-emerald-300/65 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Publish Config
        </button>
        <span className="text-xs text-textSecondary">Current status: {currentStatus}</span>
      </div>
    </div>
  );
}
