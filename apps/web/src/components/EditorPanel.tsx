import Editor from "@monaco-editor/react";

let javaCompletionsRegistered = false;

function registerJavaCompletions(monaco: any) {
  if (javaCompletionsRegistered) return;

  monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", "("],
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

      const suggestions = [
        { label: "public", kind: CompletionItemKind.Keyword, insertText: "public", range },
        { label: "private", kind: CompletionItemKind.Keyword, insertText: "private", range },
        { label: "protected", kind: CompletionItemKind.Keyword, insertText: "protected", range },
        { label: "class", kind: CompletionItemKind.Keyword, insertText: "class", range },
        { label: "static", kind: CompletionItemKind.Keyword, insertText: "static", range },
        { label: "void", kind: CompletionItemKind.Keyword, insertText: "void", range },
        { label: "int", kind: CompletionItemKind.Keyword, insertText: "int", range },
        { label: "long", kind: CompletionItemKind.Keyword, insertText: "long", range },
        { label: "double", kind: CompletionItemKind.Keyword, insertText: "double", range },
        { label: "boolean", kind: CompletionItemKind.Keyword, insertText: "boolean", range },
        { label: "String", kind: CompletionItemKind.Class, insertText: "String", range },
        { label: "List", kind: CompletionItemKind.Interface, insertText: "List", range },
        { label: "Map", kind: CompletionItemKind.Interface, insertText: "Map", range },
        { label: "HashMap", kind: CompletionItemKind.Class, insertText: "HashMap", range },
        { label: "ArrayList", kind: CompletionItemKind.Class, insertText: "ArrayList", range },
        {
          label: "for",
          kind: CompletionItemKind.Snippet,
          insertText: ["for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {", "    ${0}", "}"].join("\n"),
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "for-loop"
        },
        {
          label: "for-each",
          kind: CompletionItemKind.Snippet,
          insertText: ["for (${1:Type} ${2:item} : ${3:items}) {", "    ${0}", "}"].join("\n"),
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "enhanced for-loop"
        },
        {
          label: "if",
          kind: CompletionItemKind.Snippet,
          insertText: ["if (${1:condition}) {", "    ${0}", "}"].join("\n"),
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },
        {
          label: "main",
          kind: CompletionItemKind.Snippet,
          insertText: [
            "public static void main(String[] args) {",
            "    ${0}",
            "}"
          ].join("\n"),
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "main method"
        },
        {
          label: "sysout",
          kind: CompletionItemKind.Snippet,
          insertText: "System.out.println(${1});",
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "print to stdout"
        }
      ];

      return { suggestions };
    }
  });

  javaCompletionsRegistered = true;
}

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
      beforeMount={registerJavaCompletions}
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
        suggest: {
          showWords: true,
          snippetsPreventQuickSuggestions: false,
          preview: true
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",
        wordBasedSuggestions: "currentDocument",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        autoIndent: "full",
        formatOnPaste: true,
        formatOnType: true,
        contextmenu: true,
        mouseWheelZoom: true,
        smoothScrolling: true
      }}
    />
  );
}
