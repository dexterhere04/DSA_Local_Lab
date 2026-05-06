import Editor from "@monaco-editor/react";

export function EditorPanel({
  code,
  onChange
}: {
  code: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-700 px-4 py-2 text-sm font-medium text-slate-300">Solution.java</div>
      <Editor
        height="460px"
        defaultLanguage="java"
        theme="vs-dark"
        value={code}
        onChange={(value) => onChange(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 12 }
        }}
      />
    </section>
  );
}
