import { useForm } from "react-hook-form";
import { Panel } from "../components/ui/Panel";

type PromptForm = {
  name: string;
  systemPrompt: string;
  userTemplate: string;
};

export function PromptManagementPage() {
  const { register, handleSubmit } = useForm<PromptForm>({
    defaultValues: {
      name: "安装失败判定 Prompt",
      systemPrompt: "你是 VOC 标签判定专家，请根据标签定义输出结构化 JSON。",
      userTemplate: "输入文本：{{content_text}}"
    }
  });

  return (
    <Panel title="Prompt 管理工作台" description="围绕末级标签进行 Prompt 版本、样例和在线调试。">
      <form onSubmit={handleSubmit(() => undefined)} className="space-y-4">
        <input {...register("name")} className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2" />
        <textarea {...register("systemPrompt")} rows={4} className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2" />
        <textarea {...register("userTemplate")} rows={4} className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2" />
        <div className="flex gap-3">
          <button type="submit" className="rounded-xl bg-accent-gradient px-4 py-2 font-semibold">保存草稿</button>
          <button type="button" className="rounded-xl border border-white/15 px-4 py-2">发布新版本</button>
          <button type="button" className="rounded-xl border border-white/15 px-4 py-2">在线调试</button>
        </div>
      </form>
    </Panel>
  );
}
