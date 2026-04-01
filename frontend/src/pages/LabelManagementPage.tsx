import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import { apiDelete, apiGet, apiPost, apiPut, LabelRecord, LabelUpsertPayload } from "../lib/api";
import { filterLabels, LevelFilter, splitHighlightParts } from "./labelManagement.helpers";

type LabelFormValues = {
  category_id: number;
  parent_id: number | null;
  level: number;
  name: string;
  code: string;
  is_leaf: boolean;
  llm_enabled: boolean;
  default_prompt_version: string;
};

const defaultFormValues: LabelFormValues = {
  category_id: 1,
  parent_id: null,
  level: 1,
  name: "New Label",
  code: "L1_NEW_LABEL",
  is_leaf: false,
  llm_enabled: true,
  default_prompt_version: "v1"
};

function levelClass(level: number) {
  if (level === 1) return "border-indigo-400/45 bg-indigo-500/15 text-indigo-100";
  if (level === 2) return "border-cyan-400/45 bg-cyan-500/15 text-cyan-100";
  if (level === 3) return "border-amber-400/45 bg-amber-500/15 text-amber-100";
  return "border-rose-400/45 bg-rose-500/15 text-rose-100";
}

function renderHighlightedText(text: string, searchText: string, keyPrefix: string) {
  return splitHighlightParts(text, searchText).map((part, index) => {
    if (!part.matched) return <span key={`${keyPrefix}-${index}`}>{part.text}</span>;
    return (
      <mark
        key={`${keyPrefix}-${index}`}
        className="rounded-sm bg-amber-300/20 px-0.5 text-amber-100"
      >
        {part.text}
      </mark>
    );
  });
}

export function LabelManagementPage() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("Label taxonomy is now managed via backend API.");
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>("null");
  const deferredSearchText = useDeferredValue(searchText);

  const { register, reset, handleSubmit, watch, setValue } = useForm<LabelFormValues>({
    defaultValues: defaultFormValues
  });

  const selectedLabel = useMemo(
    () => labels.find((item) => item.id === selectedLabelId) ?? null,
    [labels, selectedLabelId]
  );

  const childCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const item of labels) {
      if (item.parent_id !== null) {
        map[item.parent_id] = (map[item.parent_id] ?? 0) + 1;
      }
    }
    return map;
  }, [labels]);

  const filteredLabels = useMemo(() => {
    return filterLabels(labels, deferredSearchText, levelFilter);
  }, [labels, deferredSearchText, levelFilter]);
  const hasSearchText = searchText.trim().length > 0;

  const parentOptions = useMemo(() => labels.filter((item) => item.id !== selectedLabelId), [labels, selectedLabelId]);
  const watchedParentId = watch("parent_id");
  const parentSelectValue = watchedParentId === null ? "null" : String(watchedParentId);

  async function loadLabels() {
    try {
      const rows = await apiGet<LabelRecord[]>("/labels/tree");
      setLabels(rows);
      setSelectedLabelId((prev) => {
        if (rows.length === 0) return null;
        if (prev !== null && rows.some((item) => item.id === prev)) return prev;
        return rows[0].id;
      });
      setNotice(`Loaded ${rows.length} labels`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load labels");
    } finally {
      setLoading(false);
    }
  }

  function createNewLabel() {
    setSelectedLabelId(null);
    setMoveTargetParentId("null");
    reset(defaultFormValues);
    setNotice("Creating a new label draft");
  }

  async function onSave(values: LabelFormValues) {
    setSaving(true);
    try {
      const payload: LabelUpsertPayload = {
        ...values,
        parent_id: values.parent_id === null ? null : Number(values.parent_id),
        level: Number(values.level),
        category_id: Number(values.category_id)
      };
      if (selectedLabelId !== null) {
        const updated = await apiPut<LabelRecord>(`/labels/${selectedLabelId}`, payload);
        setNotice(`Label #${updated.id} updated`);
      } else {
        const created = await apiPost<LabelRecord>("/labels", payload);
        setSelectedLabelId(created.id);
        setNotice(`Label #${created.id} created`);
      }
      await loadLabels();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function moveLabel() {
    if (selectedLabelId === null) {
      setNotice("Select a saved label first");
      return;
    }
    setMoving(true);
    try {
      const parentId = moveTargetParentId === "null" ? null : Number(moveTargetParentId);
      const moved = await apiPost<LabelRecord>(`/labels/${selectedLabelId}/move`, { parent_id: parentId });
      setNotice(`Label moved to level ${moved.level}`);
      await loadLabels();
      setSelectedLabelId(moved.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Move failed");
    } finally {
      setMoving(false);
    }
  }

  async function deleteLabel() {
    if (selectedLabelId === null) {
      setNotice("Select a saved label first");
      return;
    }
    setDeleting(true);
    try {
      const result = await apiDelete<{ label_id: number; status: string }>(`/labels/${selectedLabelId}`);
      setNotice(`Label #${result.label_id} deleted`);
      setSelectedLabelId(null);
      await loadLabels();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    void loadLabels();
  }, []);

  useEffect(() => {
    if (!selectedLabel) return;
    reset({
      category_id: selectedLabel.category_id,
      parent_id: selectedLabel.parent_id,
      level: selectedLabel.level,
      name: selectedLabel.name,
      code: selectedLabel.code,
      is_leaf: selectedLabel.is_leaf,
      llm_enabled: selectedLabel.llm_enabled,
      default_prompt_version: selectedLabel.default_prompt_version
    });
    setMoveTargetParentId(selectedLabel.parent_id === null ? "null" : String(selectedLabel.parent_id));
  }, [selectedLabel, reset]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel
          title="Label Tree"
          description="Browse and filter taxonomy levels"
          rightSlot={
            <button
              onClick={createNewLabel}
              className="cursor-pointer rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-100 transition-colors hover:border-indigo-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              New Label
            </button>
          }
        >
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap gap-2 text-xs">
              {(["all", "1", "2", "3", "4"] as LevelFilter[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setLevelFilter(item)}
                  className={[
                    "cursor-pointer rounded-full border px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                    levelFilter === item
                      ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100"
                      : "border-white/15 text-textSecondary hover:border-white/25"
                  ].join(" ")}
                >
                  {item === "all" ? "all" : `L${item}`}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                value={searchText}
                aria-label="Search labels"
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && hasSearchText) {
                    event.preventDefault();
                    setSearchText("");
                  }
                }}
                placeholder="Search by name or code..."
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 pr-20 text-sm outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
              />
              {hasSearchText ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border border-white/20 px-2 py-1 text-[11px] text-textSecondary transition-colors hover:border-white/35 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p className="text-xs text-textSecondary">
              Showing {filteredLabels.length} / {labels.length} labels
              {hasSearchText ? ` · keyword: "${searchText.trim()}"` : ""}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {loading ? <p className="text-textSecondary">Loading labels...</p> : null}
            {!loading && filteredLabels.length === 0 ? <p className="text-textSecondary">No labels found.</p> : null}
            {filteredLabels.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedLabelId(item.id)}
                className={[
                  "w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                  selectedLabelId === item.id
                    ? "border-indigo-400/45 bg-indigo-500/15"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-indigo-100">{renderHighlightedText(item.name, deferredSearchText, `name-${item.id}`)}</p>
                  <span className={["rounded-full border px-2 py-0.5 text-[11px]", levelClass(item.level)].join(" ")}>{`L${item.level}`}</span>
                </div>
                <p className="text-xs text-textSecondary">
                  code: {renderHighlightedText(item.code, deferredSearchText, `code-${item.id}`)} | children: {childCountMap[item.id] ?? 0}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Label Detail" description="Edit hierarchy, code, and LLM strategy">
          <form onSubmit={handleSubmit((values) => void onSave(values))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Category ID</span>
                <input
                  type="number"
                  {...register("category_id", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Level</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  {...register("level", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Parent</span>
                <Select
                  value={parentSelectValue}
                  onChange={(nextValue) => setValue("parent_id", nextValue === "null" ? null : Number(nextValue))}
                  options={[
                    { value: "null", label: "root" },
                    ...parentOptions.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))
                  ]}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Name</span>
                <input
                  {...register("name")}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Code</span>
                <input
                  {...register("code")}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Default Prompt Version</span>
                <input
                  {...register("default_prompt_version")}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <div className="flex items-center gap-6 pt-5 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" {...register("is_leaf")} className="h-4 w-4" />
                  <span>Leaf Node</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" {...register("llm_enabled")} className="h-4 w-4" />
                  <span>LLM Enabled</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-xl bg-accent-gradient px-4 py-2 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                disabled={deleting || selectedLabelId === null}
                onClick={() => void deleteLabel()}
                className="cursor-pointer rounded-xl border border-rose-400/40 px-4 py-2 text-sm text-rose-100 transition-colors hover:border-rose-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-xs text-textSecondary">Quick Move</p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={moveTargetParentId}
                onChange={setMoveTargetParentId}
                className="min-w-[280px]"
                options={[
                  { value: "null", label: "root" },
                  ...parentOptions.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))
                ]}
              />
              <button
                type="button"
                disabled={moving || selectedLabelId === null}
                onClick={() => void moveLabel()}
                className="cursor-pointer rounded-lg border border-cyan-400/40 px-3 py-2 text-sm text-cyan-100 transition-colors hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {moving ? "Moving..." : "Move"}
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
