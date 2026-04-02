import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Textarea } from "../components/ui/Textarea";
import { apiGet, apiPost, apiPut } from "../lib/api";
import type { LabelTaxonomyRecord, TaxonomyStatus } from "../lib/api";
import { defaultVersionIdForTaxonomy, getDemoTaxonomyById } from "./labelTaxonomy.fixtures";

type FormValues = {
  name: string;
  code: string;
  description: string;
  owner: string;
  businessScopeText: string;
  categoryScopeText: string;
  status: TaxonomyStatus;
};

const emptyValues: FormValues = {
  name: "",
  code: "",
  description: "",
  owner: "",
  businessScopeText: "",
  categoryScopeText: "",
  status: "draft"
};

function toFormValues(record: LabelTaxonomyRecord): FormValues {
  return {
    name: record.name,
    code: record.code,
    description: record.description ?? "",
    owner: record.owner ?? "",
    businessScopeText: record.businessScope.join(", "),
    categoryScopeText: record.categoryScope.join(", "),
    status: record.status
  };
}

function normalizeScopes(input: string) {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function LabelTaxonomyFormPage() {
  const { taxonomyId } = useParams<{ taxonomyId: string }>();
  const isEditMode = Boolean(taxonomyId);
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<FormValues>(emptyValues);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(isEditMode ? "正在加载体系信息..." : "创建新的标签体系");

  useEffect(() => {
    if (!isEditMode || !taxonomyId) return;
    const editingTaxonomyId = taxonomyId;
    let mounted = true;
    async function loadTaxonomy() {
      try {
        const row = await apiGet<LabelTaxonomyRecord>(`/label-taxonomies/${editingTaxonomyId}`);
        if (!mounted) return;
        setFormValues(toFormValues(row));
        setNotice(`正在编辑体系：${row.name}`);
      } catch {
        if (!mounted) return;
        const fallback = getDemoTaxonomyById(editingTaxonomyId);
        if (fallback) {
          setFormValues(toFormValues(fallback));
          setNotice(`后端 API 未接通，当前编辑本地演示体系：${fallback.name}`);
        } else {
          setNotice("未找到体系数据，请返回列表重新选择。");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadTaxonomy();
    return () => {
      mounted = false;
    };
  }, [isEditMode, taxonomyId]);

  const formError = useMemo(() => {
    if (!formValues.name.trim()) return "体系名称必填";
    if (!formValues.code.trim()) return "体系编码必填";
    if (!/^[A-Za-z0-9_-]+$/.test(formValues.code.trim())) return "体系编码仅允许字母、数字、下划线和中划线";
    return null;
  }, [formValues]);

  async function save(goToDetailAfterSave: boolean) {
    if (formError) {
      setNotice(formError);
      return;
    }
    setSaving(true);
    const payload = {
      name: formValues.name.trim(),
      code: formValues.code.trim(),
      description: formValues.description.trim(),
      owner: formValues.owner.trim(),
      businessScope: normalizeScopes(formValues.businessScopeText),
      categoryScope: normalizeScopes(formValues.categoryScopeText),
      status: formValues.status
    };

    try {
      if (isEditMode && taxonomyId) {
        const updated = await apiPut<LabelTaxonomyRecord>(`/label-taxonomies/${taxonomyId}`, payload);
        setNotice(`已保存体系：${updated.name}`);
        if (goToDetailAfterSave) {
          const targetVersion = updated.currentVersionId ?? defaultVersionIdForTaxonomy(updated.id);
          navigate(`/label-taxonomies/${updated.id}/version/${targetVersion}`);
        }
      } else {
        const created = await apiPost<LabelTaxonomyRecord>("/label-taxonomies", payload);
        setNotice(`已创建体系：${created.name}`);
        if (goToDetailAfterSave) {
          const targetVersion = created.currentVersionId ?? defaultVersionIdForTaxonomy(created.id);
          navigate(`/label-taxonomies/${created.id}/version/${targetVersion}`);
        }
      }
    } catch {
      setNotice("后端 API 未接通，当前为表单结构演示态。");
      if (goToDetailAfterSave) {
        const fallbackTaxonomyId = taxonomyId ?? "tax-install-service";
        navigate(`/label-taxonomies/${fallbackTaxonomyId}/version/${defaultVersionIdForTaxonomy(fallbackTaxonomyId)}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <Panel title={isEditMode ? "编辑标签体系" : "创建标签体系"} description="维护体系元信息：名称、编码、范围、Owner 与状态">
        {loading ? <p className="text-sm text-textSecondary">Loading taxonomy...</p> : null}

        {!loading ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save(false);
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>体系名称</span>
                <input
                  value={formValues.name}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>

              <label className="space-y-1 text-xs text-textSecondary">
                <span>体系编码</span>
                <input
                  value={formValues.code}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, code: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
            </div>

            <label className="space-y-1 text-xs text-textSecondary">
              <span>描述</span>
              <Textarea
                rows={4}
                value={formValues.description}
                onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Owner</span>
                <input
                  value={formValues.owner}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, owner: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>状态</span>
                <select
                  value={formValues.status}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, status: event.target.value as TaxonomyStatus }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>业务范围（英文逗号分隔）</span>
                <input
                  value={formValues.businessScopeText}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, businessScopeText: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>品类范围（英文逗号分隔）</span>
                <input
                  value={formValues.categoryScopeText}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, categoryScopeText: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-xl bg-accent-gradient px-4 py-2 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "保存"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save(true)}
                className="cursor-pointer rounded-xl border border-indigo-400/45 px-4 py-2 text-sm text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
              >
                保存并进入体系
              </button>
              <button
                type="button"
                onClick={() => navigate("/label-taxonomies")}
                className="cursor-pointer rounded-xl border border-white/20 px-4 py-2 text-sm text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary"
              >
                取消返回
              </button>
            </div>
          </form>
        ) : null}
      </Panel>
    </div>
  );
}
