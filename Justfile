set dotenv-load := false

default:
    @just --list

install:
    npm install

dev port="5173":
    npm run dev -- --port {{port}}

# List installed workspace themes and their variants.
theme-list:
    npm run theme:list

# Validate one theme workspace package.
theme-check theme="themes/elegant-blog":
    npm run theme:check -- {{theme}}

# Preview a theme without modifying the tracked org-zhixing.toml.
theme-preview theme="elegant-blog" port="5173":
    node packages/theme-tooling/src/theme-preview.mjs --theme {{theme}} --port {{port}}

typecheck:
    npm run typecheck

harness:
    npm run harness

harness-json:
    npm run harness:json

harness-agent-snapshot:
    npm run harness:agent-snapshot

static:
    npm run generate:static

test:
    npm test

build:
    npm run build

check:
    npm run ci

perf repeat="1" iterations="20":
    npm run perf:wasm -- --repeat={{repeat}} --iterations={{iterations}}
    npm run perf:ui

preview port="4173":
    npm run preview -- --port {{port}}

smoke port="5173":
    curl -fsS http://127.0.0.1:{{port}}/ >/dev/null

clean:
    rm -rf dist tsconfig.tsbuildinfo
