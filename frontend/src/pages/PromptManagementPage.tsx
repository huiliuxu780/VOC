import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Panel } from "../components/ui/Panel";
import { apiGet, apiPost, apiPut, PromptRecord, PromptTestResponse, PromptUpsertPayload } from "../lib/api";

type PromptFormValues = {
  label_node_id: number;
  name: string;
  version: string;
  system_prompt: string;
  user_prompt_template: string;
};

type PromptStatusFilter = "all" | "draft" | "published";

const defaultValues: PromptFormValues = {
  label_node_id: 3,
  name: "安装失败判定 Prompt",
  version: "v3.2",
  system_prompt: "你是 VOC 标签判定专家，请根据标签定义输出结构化 JSON。",
  user_prompt_template: "输入文本：{{content_text}}"
};

function statusClass(status: string) {
  if (status === "published") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (status === "draft") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/[0.03] text-textSecondary";
}

export function PromptManagementPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("Prompt data is live from backend API.");
  const [statusFilter, setStatusFilter] = useState<PromptStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState("预约安装一直超时，客服无人处理");
  const [testResult, setTestResult] = useState<PromptTestResponse | null>(null);
  const deferredSearchText = useDeferredValue(searchText);

  const { register, handleSubmit, reset } = useForm<PromptFormValues>({
    defaultValues
  });

  const selectedPrompt = useMemo(
    () => prompts.find((item) => item.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId]
  );

  const filteredPrompts = useMemo(() => {
    const keyword = deferredSearchText.trim().toLowerCase();
    if (!keyword) return prompts;
    return prompts.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.version.toLowerCase().includes(keyword) ||
        String(item.label_node_id).includes(keyword)
    );
  }, [prompts, deferredSearchText]);

  async function loadPrompts() {
    try {
      const rows = await apiGet<PromptRecord[]>(`/prompts?status=${encodeURIComponent(statusFilter)}`);
      setPrompts(rows);
      setSelectedPromptId((prev) => {
        if (rows.length === 0) return null;
        if (prev && rows.some((item) => item.id === prev)) return prev;
        return rows[0].id;
      });
      setNotice(`Loaded ${rows.length} prompt records`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  async function onSave(values: PromptFormValues) {
    setSaving(true);
    try {
      if (selectedPromptId) {
        const payload: PromptUpsertPayload & { status: string } = { ...values, status: selectedPrompt?.status ?? "draft" };
        const updated = await apiPut<PromptRecord>(`/prompts/${selectedPromptId}`, payload);
        setNotice(`Prompt #${updated.id} updated`);
      } else {
        const created = await apiPost<PromptRecord>("/prompts", values);
        setNotice(`Prompt #${created.id} created as draft`);
        setSelectedPromptId(created.id);
      }
      await loadPrompts();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function publishPrompt() {
    if (!selectedPromptId) {
      setNotice("Please save draft first, then publish.");
      return;
    }
    setPublishing(true);
    try {
      const result = await apiPost<{ prompt_id: number; status: string }>(`/prompts/${selectedPromptId}/publish`);
      setNotice(`Prompt #${result.prompt_id} published`);
      await loadPrompts();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function testPromptOnline() {
    if (!selectedPromptId) {
      setNotice("Please save draft first, then run online test.");
      return;
    }
    setTesting(true);
    try {
      const result = await apiPost<PromptTestResponse>(`/prompts/${selectedPromptId}/test`, { content_text: testInput });
      setTestResult(result);
      setNotice(`Prompt test completed: ${result.output.label}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Online test failed");
    } finally {
      setTesting(false);
    }
  }

  function createDraftFromTemplate() {
    setSelectedPromptId(null);
    setTestResult(null);
    reset(defaultValues);
    setNotice("Creating a new draft from template");
  }

  useEffect(() => {
    void loadPrompts();
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedPrompt) return;
    reset({
      label_node_id: selectedPrompt.label_node_id,
      name: selectedPrompt.name,
      version: selectedPrompt.version,
      system_prompt: selectedPrompt.system_prompt,
      user_prompt_template: selectedPrompt.user_prompt_template
    });
    setTestResult(null);
  }, [selectedPrompt, reset]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Panel
          title="Prompt 列表"
          description="按标签、版本、状态管理 Prompt 资产"
          rightSlot={
            <button
              onClick={createDraftFromTemplate}
              className="cursor-pointer rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-100 transition-colors hover:border-indigo-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              New Draft
            </button>
          }
        >
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap gap-2 text-xs">
              {(["all", "draft", "published"] as PromptStatusFilter[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={[
                    "cursor-pointer rounded-full border px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                    statusFilter === item
                      ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100"
                      : "border-white/15 text-textSecondary hover:border-white/25"
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name/version/label node..."
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
            />
          </div>

          <div className="space-y-2 text-sm">
            {loading ? <p className="text-textSecondary">Loading prompts...</p> : null}
            {!loading && filteredPrompts.length === 0 ? <p className="text-textSecondary">No prompts found.</p> : null}
            {filteredPrompts.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPromptId(item.id)}
                className={[
                  "w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                  selectedPromptId === item.id
                    ? "border-indigo-400/45 bg-indigo-500/15"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-indigo-100">{item.name}</p>
                  <span className={["rounded-full border px-2 py-0.5 text-[11px]", statusClass(item.status)].join(" ")}>{item.status}</span>
                </div>
                <p className="text-xs text-textSecondary">version: {item.version} | label_node: {item.label_node_id}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Prompt 编辑器" description="草稿保存、发布和在线调试一体化">
          <form onSubmit={handleSubmit((values) => void onSave(values))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Label Node ID</span>
                <input
                  type="number"
                  {...register("label_node_id", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Prompt Name</span>
                <input
                  {...register("name")}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Version</span>
                <input
                  {...register("version")}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
            </div>

            <label className="space-y-1 text-xs text-textSecondary">
              <span>System Prompt</span>
              <textarea
                rows={5}
                {...register("system_prompt")}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
              />
            </label>

            <label className="space-y-1 text-xs text-textSecondary">
              <span>User Prompt Template</span>
              <textarea
                rows={4}
                {...register("user_prompt_template")}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-xl bg-accent-gradient px-4 py-2 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={() => void publishPrompt()}
                className="cursor-pointer rounded-xl border border-emerald-400/40 px-4 py-2 text-sm text-emerald-100 transition-colors hover:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={() => void testPromptOnline()}
                className="cursor-pointer rounded-xl border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100 transition-colors hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? "Testing..." : "Online Test"}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-textSecondary">Online Test Input</p>
            <textarea
              rows={3}
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
            />
            {testResult ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
                <p className="text-indigo-100">Result: {testResult.output.label}</p>
                <p className="text-textSecondary">Score: {testResult.output.score}</p>
                <p className="text-textSecondary">Reason: {testResult.output.reason}</p>
              </div>
            ) : (
              <p className="text-xs text-textSecondary">No test result yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
