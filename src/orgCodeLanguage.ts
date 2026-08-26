export const normalizeOrgCodeLanguage = (language: string): string => {
  const normalized = language.trim().toLowerCase();
  return (
    {
      gerbil: "scheme",
      lisp: "scheme",
      racket: "scheme",
      js: "javascript",
      md: "markdown",
      py: "python",
      sh: "bash",
      shell: "bash",
      tex: "latex",
      ts: "typescript",
      typ: "typst",
      yml: "yaml",
    }[normalized] ?? normalized
  );
};

export const languageFromOrgCodeClasses = (classes: Iterable<string>): string | null => {
  for (const className of classes) {
    const match = /^(?:src-|language-)([\w+-]+)$/i.exec(className);
    if (!match) continue;
    const declaredLanguage = match[1]?.toLowerCase();
    if (!declaredLanguage || declaredLanguage === "mermaid") return null;
    return normalizeOrgCodeLanguage(declaredLanguage);
  }
  return null;
};
