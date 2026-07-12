module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      staticDistDir: "./.cache/lighthouse",
      isSinglePageApplication: true,
      url: [
        "http://127.0.0.1/org-zhixing-themes/blogs",
        "http://127.0.0.1/org-zhixing-themes/gallery/",
        "http://127.0.0.1/org-zhixing-themes/travel/",
        "http://127.0.0.1/org-zhixing-themes/agenda",
      ],
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3 },
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
        viewport: "error",
        "errors-in-console": "error",
        "target-size": "error",
        "dom-size": ["error", { maxNumericValue: 1500 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2200, aggregationMethod: "median" }],
        "largest-contentful-paint": [
          "warn",
          { maxNumericValue: 3300, aggregationMethod: "median" },
        ],
        "total-blocking-time": ["warn", { maxNumericValue: 350, aggregationMethod: "median" }],
      },
    },
    upload: { target: "filesystem", outputDir: "./benchmarks/reports/lighthouse" },
  },
};
