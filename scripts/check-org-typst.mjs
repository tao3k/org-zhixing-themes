import { validateOrgTypst } from "../src/node/orgTypstValidation.ts";

const roots = process.argv.slice(2);
const result = await validateOrgTypst(roots.length > 0 ? roots : ["docs"]);
console.log(`org-typst ok blocks=${result.blocks} files=${result.files}`);
