try {
  await import("./theme-federation.mjs");
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
