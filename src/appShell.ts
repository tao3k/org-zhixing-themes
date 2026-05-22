export const renderAppShell = (): string => `
  <main class="shell">
    <header class="site-header">
      <a class="site-brand" href="?view=blog" aria-label="Zhixing home">
        <span>知行合一</span>
        <small>Zhixing</small>
      </a>
      <nav id="tabs" class="site-nav" aria-label="Life archive navigation"></nav>
      <output id="status" class="site-status">Loading Org parser...</output>
    </header>
    <section class="site-hero">
      <div class="hero-copy">
        <p class="eyebrow">Personal digital garden</p>
        <h1 id="site-title">知行合一</h1>
        <p>把写作、札记、事件与行动议程放回同一个 Org 源头，让知识不只被收藏，也能进入每天的实践。</p>
      </div>
      <div class="knowledge-map" aria-hidden="true">
        <span class="map-line map-line--one"></span>
        <span class="map-line map-line--two"></span>
        <span class="map-line map-line--three"></span>
        <b class="map-node map-node--core">知</b>
        <b class="map-node map-node--agenda">Agenda</b>
        <b class="map-node map-node--blog">Blogs</b>
        <b class="map-node map-node--event">Events</b>
        <b class="map-node map-node--note">ZK</b>
      </div>
    </section>
    <section class="blog-source-panel" aria-label="Org blog sources">
      <div class="source-feed-heading">
        <div>
          <span>Archive sources</span>
          <small>Org files as quiet substrate</small>
        </div>
        <div id="source-picker" class="source-picker" aria-label="Source"></div>
      </div>
      <div id="source-feed" class="source-feed" role="list"></div>
    </section>
    <section class="viewer-pane">
      <div id="view"></div>
    </section>
    <div class="runtime-state" aria-hidden="true">
      <strong id="active-source-title">Loading source...</strong>
      <small id="active-source-path">blog source</small>
    </div>
  </main>
`;
