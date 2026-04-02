import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import type { LabelNodeTestRecord, LabelNodeTestResult } from "../lib/api";

type TestRecordHitLabelOption = {
  value: string;
  label: string;
};

type TaxonomyNodeTestingSectionProps = {
  testInput: string;
  testRunning: boolean;
  testResult: LabelNodeTestResult | null;
  testRecordsLoading: boolean;
  testRecords: LabelNodeTestRecord[];
  testRecordOffset: number;
  testRecordTotal: number;
  testRecordHasMore: boolean;
  testRecordHitLabel: string;
  testRecordKeyword: string;
  testRecordHitLabelOptions: TestRecordHitLabelOption[];
  onTestInputChange: (value: string) => void;
  onRunTest: () => void;
  onTestRecordHitLabelChange: (value: string) => void;
  onTestRecordKeywordChange: (value: string) => void;
  onApplyTestRecordFilters: () => void;
  onResetTestRecordFilters: () => void;
  onGoToPreviousTestRecordPage: () => void;
  onGoToNextTestRecordPage: () => void;
};

export function TaxonomyNodeTestingSection({
  testInput,
  testRunning,
  testResult,
  testRecordsLoading,
  testRecords,
  testRecordOffset,
  testRecordTotal,
  testRecordHasMore,
  testRecordHitLabel,
  testRecordKeyword,
  testRecordHitLabelOptions,
  onTestInputChange,
  onRunTest,
  onTestRecordHitLabelChange,
  onTestRecordKeywordChange,
  onApplyTestRecordFilters,
  onResetTestRecordFilters,
  onGoToPreviousTestRecordPage,
  onGoToNextTestRecordPage
}: TaxonomyNodeTestingSectionProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <section className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textSecondary">Debug Console</p>
          <p className="text-[11px] text-textSecondary">Run one-shot inference and inspect model outputs before release.</p>
        </div>
        <label className="space-y-1 text-xs text-textSecondary">
          <span>Testing Input</span>
          <Textarea rows={4} value={testInput} onChange={(event) => onTestInputChange(event.target.value)} />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={testRunning}
            onClick={onRunTest}
            className="cursor-pointer rounded-lg border border-cyan-400/45 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-300/65 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {testRunning ? "Running..." : "Run Test"}
          </button>
        </div>

        {testResult ? (
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-textSecondary">
            <p>
              hitLabel: <span className="text-textPrimary">{testResult.hitLabel}</span>
            </p>
            <p>
              confidence: <span className="text-textPrimary">{testResult.confidence}</span> | latency:{" "}
              <span className="text-textPrimary">{testResult.latency}ms</span>
            </p>
            <p>
              errorMessage: <span className="text-textPrimary">{testResult.errorMessage ?? "-"}</span>
            </p>
            <div>
              <p className="mb-1">parsedOutput:</p>
              <pre className="overflow-auto rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textPrimary">
                {JSON.stringify(testResult.parsedOutput, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1">rawOutput:</p>
              <pre className="overflow-auto rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textPrimary">{testResult.rawOutput}</pre>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 p-3 text-xs text-textSecondary">
            Run test to view rawOutput / parsedOutput / hitLabel / confidence / latency / errorMessage.
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textSecondary">Record Explorer</p>
          <p className="text-[11px] text-textSecondary">Filter and paginate historical test records for quick regression checks.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-xs text-textSecondary">Record Filters</p>
          <div className="grid gap-2 md:grid-cols-[180px_1fr_auto_auto]">
            <Select value={testRecordHitLabel} onChange={onTestRecordHitLabelChange} options={testRecordHitLabelOptions} />
            <input
              value={testRecordKeyword}
              onChange={(event) => onTestRecordKeywordChange(event.target.value)}
              placeholder="Search input / label / output..."
              className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
            />
            <button
              type="button"
              disabled={testRecordsLoading}
              onClick={onApplyTestRecordFilters}
              className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Apply
            </button>
            <button
              type="button"
              disabled={testRecordsLoading}
              onClick={onResetTestRecordFilters}
              className="cursor-pointer rounded-lg border border-white/20 px-3 py-1.5 text-xs text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-textSecondary">Recent Test Records</p>
            <p className="text-[11px] text-textSecondary">
              Showing {testRecordTotal === 0 ? 0 : testRecordOffset + 1}-{testRecordOffset + testRecords.length} / {testRecordTotal}
            </p>
          </div>
          {testRecordsLoading ? <p className="text-xs text-textSecondary">Loading test records...</p> : null}
          {!testRecordsLoading && testRecords.length === 0 ? <p className="text-xs text-textSecondary">No test records yet.</p> : null}
          <div className="space-y-2">
            {testRecords.map((record) => (
              <article key={record.id} className="rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textSecondary">
                <p>
                  <span className="text-textPrimary">{record.hitLabel}</span> | confidence {record.confidence} | latency {record.latency}ms
                </p>
                <p>input: {record.inputText}</p>
                <p>at: {record.createdAt}</p>
              </article>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={testRecordsLoading || testRecordOffset <= 0}
              onClick={onGoToPreviousTestRecordPage}
              className="cursor-pointer rounded-md border border-white/20 px-2.5 py-1 text-[11px] text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={testRecordsLoading || !testRecordHasMore}
              onClick={onGoToNextTestRecordPage}
              className="cursor-pointer rounded-md border border-indigo-400/45 px-2.5 py-1 text-[11px] text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
