if (document.doctype == null) {
  document.insertBefore(
    document.implementation.createDocumentType("html", "", ""),
    document.documentElement,
  );
}

if (document.compatMode !== "CSS1Compat") {
  Object.defineProperty(document, "compatMode", {
    configurable: true,
    value: "CSS1Compat",
  });
}
