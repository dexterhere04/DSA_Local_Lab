import Editor from "@monaco-editor/react";

export function EditorPanel({
  code,
  onChange
}: {
  code: string;
  onChange: (value: string) => void;
}) {
  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      theme="vs-dark"
      value={code}
      onChange={(value) => onChange(value ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "JetBrains Mono, monospace",
        padding: { top: 12, bottom: 12 },
        lineNumbers: "on",
        renderLineHighlight: "line",
        scrollBeyondLastLine: false,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          useShadows: false
        },
        suggest: { showWords: false },
        contextmenu: true,
        mouseWheelZoom: true,
        smoothScrolling: true
      }}
    />
  );
}
