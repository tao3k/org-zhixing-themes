export type FederatedContentRoutes<TShell, TDocumentData, TRendered> = Readonly<{
  exclusiveContentRoutes?: boolean;
  loadDocument: (shell: TShell, documentId: string) => Promise<TDocumentData>;
  renderDocument: (data: TDocumentData) => TRendered;
  renderHome: (shell: TShell) => TRendered;
}>;

export const defineFederatedContentRoutes = <TShell, TDocumentData, TRendered>(
  routes: FederatedContentRoutes<TShell, TDocumentData, TRendered>,
): FederatedContentRoutes<TShell, TDocumentData, TRendered> => routes;
