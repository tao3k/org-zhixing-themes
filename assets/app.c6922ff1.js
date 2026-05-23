(()=>{"use strict";var e,t,a,r,n,l,i,o={7187(e,t,a){a.d(t,{QV:()=>s,Ur:()=>i,Vo:()=>o,aM:()=>d,t$:()=>c});var r=a(6297);let n="org-zhixing-demo.org",l="demo",i=async()=>{let e=x(),t=await fetch(o(e),{cache:"no-store"});if(!t.ok)throw Error(`failed to load ${e}: HTTP ${t.status}`);return u(await t.text())},o=e=>new URL(S(e),k()),s=e=>{let t=new URLSearchParams(window.location.search).get("source");return t?d(e,t):e.defaultSourceId?d(e,e.defaultSourceId):e.sources[0]},d=(e,t)=>{let a=e.sources.find(e=>e.id===t);if(a)return a;let r=O(t,e.contentRoot);return e.sources.find(e=>e.file===r)??{id:r,name:r,file:r,sourceFile:w(e.contentRoot,r)}},c=e=>{let t=new URLSearchParams(window.location.search).get("perf");return null===t?e:"0"!==t&&"false"!==t},u=e=>{let t=H((0,r.qg)(e)),a=G(t.site),i=G(t.content),o=G(t.ui),s=f(G(t.agenda)),d=h(G(t.behavior),o),c=A(L(i,"content_dir",L(i,"root","blog"))),u=v(G(t.attachments),c),p=R(i,"default_source"),m=$(G(t.content)?.sources,c);return{title:L(a,"title","Org Zhixing"),locale:L(a,"locale","zh-CN"),basePath:g(a),contentRoot:c,defaultSourceId:p,defaultView:W(o?.default_view,"blog"),agenda:s,attachments:u,behavior:d,menu:y(o?.views),sources:m.length>0?m:[b(c,l,n,"Org Zhixing Demo")]}},g=e=>m(R(e,"base_path")??p(R(e,"base_url"))??"/"),p=e=>{if(!e)return null;try{return new URL(e).pathname}catch{return e}},m=e=>{let t=e.trim();return t&&"/"!==t?`/${t.replace(/^\/+|\/+$/g,"")}`:"/"},h=(e,t)=>({showPerformance:j(t,"show_timings",!0),lazyLint:j(e,"lazy_lint",!0)}),f=e=>{let t=P(e,"start")??M(),a=U(I(e,"days",7),1,31),r=F(t,a-1);return{start:t,end:r,days:a,limit:D(e,"limit"),label:1===a?q(t):`${q(t)} - ${q(r)}`,mode:B(e?.mode,"classic")}},v=(e,t)=>({attachIdDir:E(L(e,"attach_id_dir",".attach"),t),checkVcs:j(e,"check_vcs",!1),checkAnnex:j(e,"check_annex",!1),scanOrphans:j(e,"scan_orphans",!1)}),y=e=>{let t=Array.isArray(e)?e.map(H).map(e=>({name:L(e,"label",W(e.id,"blog")),view:W(e.id,"blog"),weight:I(e,"weight",0)})):[];return(t.length>0?t:C()).sort((e,t)=>e.weight-t.weight)},$=(e,t)=>Array.isArray(e)?e.map(H).map(e=>b(t,L(e,"id",l),O(L(e,"file",n),t),L(e,"title",L(e,"file",n)))):[],b=(e,t,a,r)=>({id:t,name:r,file:a,sourceFile:w(e,a)}),w=(e,t)=>`${e}/${t}`,k=()=>{let e=Array.from(document.scripts).find(e=>!!e.src&&new URL(e.src).pathname.includes("/assets/"));return e?.src?new URL("../",e.src):new URL(".",document.baseURI)},S=e=>e.replace(/^\/+/,""),C=()=>[{name:"Blogs",view:"blog",weight:10},{name:"Gallery",view:"gallery",weight:18},{name:"Notes",view:"records",weight:20},{name:"Travel",view:"travel",weight:22},{name:"Memory",view:"memory",weight:25},{name:"Agenda",view:"agenda",weight:30}],x=()=>{let e=new URLSearchParams(window.location.search).get("config");if(!e)return"org-zhixing.toml";if(!e.endsWith(".toml")||e.includes("/")||e.includes("\\"))throw Error("config must be a root public TOML file");return e},A=e=>{let t=e.replace(/^\/+|\/+$/g,"");return T(t),t},E=(e,t)=>{let a=e.replace(/^\/+|\/+$/g,""),r=".attach"===a?`${t}/.attach`:a.startsWith(`${t}/`)?a:`${t}/${a}`;return N(r),r},O=(e,t)=>{let a=`${t}/`,r=(e.startsWith(a)?e.slice(a.length):e).replace(/^\/+/,"");if(T(r),!r.endsWith(".org"))throw Error(`Org source must end with .org: ${e}`);return r},T=e=>{if(0===e.length||e.startsWith(".")||e.includes("..")||e.includes("//")||e.includes("\\"))throw Error(`unsafe config path: ${e}`)},N=e=>{let t=e.split("/");if(0===e.length||e.includes("..")||e.includes("//")||e.includes("\\")||t.some(e=>0===e.length||e.startsWith(".")&&".attach"!==e))throw Error(`unsafe attachment path: ${e}`)},L=(e,t,a)=>{let r=e?.[t];return"string"==typeof r&&r.length>0?r:a},R=(e,t)=>{let a=e?.[t];return"string"==typeof a&&a.length>0?a:null},j=(e,t,a)=>{let r=e?.[t];return"boolean"==typeof r?r:a},I=(e,t,a)=>{let r=e?.[t];return"number"==typeof r?r:a},D=(e,t)=>{let a=e?.[t];return"number"!=typeof a||!Number.isFinite(a)||a<=0?null:Math.trunc(a)},P=(e,t)=>{let a=e?.[t];if("string"!=typeof a)return null;let r=/^(\d{4})-(\d{2})-(\d{2})$/.exec(a);if(!r)throw Error(`agenda ${t} must be YYYY-MM-DD`);return{year:Number(r[1]),month:Number(r[2]),day:Number(r[3])}},M=()=>{let e=new Date;return{year:e.getFullYear(),month:e.getMonth()+1,day:e.getDate()}},F=(e,t)=>{let a=new Date(Date.UTC(e.year,e.month-1,e.day+t));return{year:a.getUTCFullYear(),month:a.getUTCMonth()+1,day:a.getUTCDate()}},q=e=>`${e.year}-${_(e.month)}-${_(e.day)}`,_=e=>String(e).padStart(2,"0"),U=(e,t,a)=>Math.min(a,Math.max(t,Math.trunc(e))),W=(e,t)=>V(e)?e:t,B=(e,t)=>z(e)??t,V=e=>"blog"===e||"gallery"===e||"records"===e||"memory"===e||"travel"===e||"agenda"===e||"capture"===e||"diagnostics"===e,z=e=>"classic"===e||"strict"===e||"auto"===e||"agent"===e?e:"focus"===e?"classic":"pressure"===e?"strict":"flow"===e?"auto":null,G=e=>e&&"object"==typeof e&&!Array.isArray(e)?e:null,H=e=>G(e)??{}},1477(e,t,a){var r=a(4848),n=a(7793),l=a(5338),i=a(855),o=a(2166),s=a(1416),d=a(8590),c=a(4321),u=a(6540),g=a(4496);let p=e=>[...(0,g.SN)(e)].sort(h),m=e=>v(e)??"Article",h=(e,t)=>{let a=f(e),r=f(t);return null!==a&&null!==r&&a!==r?r-a:null!==a?-1:null!==r?1:e.rangeStart-t.rangeStart},f=e=>{let t=v(e);if(!t)return null;let a=t.match(/(\d{4}-\d{2}-\d{2})(?:\s+\w+)?(?:\s+(\d{1,2}:\d{2}))?/);if(!a)return null;let r=Date.parse(`${a[1]}T${a[2]??"00:00"}:00Z`);return Number.isNaN(r)?null:r},v=e=>y(e,"CLOSED")??y(e,"DATE")??y(e,"SCHEDULED")??e.planning.closed??e.planning.scheduled??null,y=(e,t)=>e.properties.find(e=>e.key.toUpperCase()===t)?.value??null,$=e=>w(e),b=e=>({...e,source:k(e)}),w=e=>{switch(e.kind){case"anything":return":anything t";case"blocked":return':and (:children todo :property "ORDERED")';case"category":return`:category ${C(e.values)}`;case"closed":return":log closed";case"deadline":return":deadline t";case"done":return':todo ("DONE" "CANCELED")';case"memory":return':or (:property "ID" :tag ("record" "memory"))';case"effort":return`:effort${e.operator} ${x(e.value)}`;case"priority":return"="===e.operator?`:priority ${x(e.value)}`:`:priority${e.operator} ${x(e.value)}`;case"property":return e.values?`:property (${x(e.key)} ${C(e.values)})`:`:property ${x(e.key)}`;case"scheduled":return":scheduled t";case"tag":return`:tag ${C(e.values)}`;case"time-grid":return":time-grid t";case"todo":return`:todo ${C(e.values)}`;case"and":return`:and (${e.selectors.map(w).join(" ")})`;case"not":return`:not (${w(e.selector)})`;case"or":return e.selectors.map(w).join(" ");case"take":return`:take (${e.count} (${w(e.selector)}))`;case"discard":return`:discard (${w(e.selector)})`;case"auto":return"property"===e.by?`:auto-property ${x(e.property??"")}`:`:auto-${e.by} t`}},k=e=>{let t=new Set,a=e.rules.flatMap(a=>{if(!a.orderMulti||t.has(a.id))return t.has(a.id)?[]:[`  ${S(a,!0)}`];let r=e.rules.filter(e=>e.orderMulti===a.orderMulti);return r.length<2?[`  ${S(a,!0)}`]:(r.forEach(e=>t.add(e.id)),[`  (:order-multi (${a.order}
${r.map(e=>`    ${S(e,!1)}`).join("\n")}))`])});return`(setq org-super-agenda-groups
 '(
${a.join("\n")}
   ))`},S=(e,t)=>{let a=[`:name ${x(e.title)}`,$(e.selector),t&&0!==e.order?`:order ${e.order}`:null,e.face?`:face ${x(e.face)}`:null,e.transformer?`:transformer ${x(e.transformer)}`:null].filter(Boolean);return`(${a.join("\n   ")})`},C=e=>1===e.length?x(e[0]):`(${e.map(x).join(" ")})`,x=e=>`"${e.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,A=function(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return{kind:"and",selectors:t}},E=(e,t)=>({kind:"auto",by:e,property:t}),O=function(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return{kind:"or",selectors:t}},T=(e,t)=>({kind:"priority",operator:e,value:t}),N=(e,t)=>({kind:"property",key:e,values:t}),L=function(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return{kind:"tag",values:t}},R=function(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return{kind:"todo",values:t}},j={kind:"blocked"},I={kind:"closed"},D={kind:"deadline"},P={kind:"done"},M={kind:"memory"},F={classic:b({key:"classic",label:"Classic Super Agenda",shortLabel:"Classic",description:"A browser version of the README pattern: today, important, waiting, backlog.",intent:"Make the consume order legible while preserving the daily agenda surface.",rules:[{id:"today",title:"Today",subtitle:"Timed rows or explicit TODAY/NEXT execution state.",selector:O({kind:"time-grid"},R("TODAY","NEXT")),order:0,tone:"focus",face:"time grid accent",transformer:"uppercase-title"},{id:"important",title:"Important",subtitle:"Deadline pressure, blocker edges, priority A, and focus tags are pulled first.",selector:O(D,j,T("<=","A"),L("focus","ops")),order:0,tone:"deadline",transformer:"deadline-risk-label"},{id:"context",title:"Record / Memory Context",subtitle:"Items carrying record, memory, attachment, or ID evidence.",selector:O(M,L("record","memory","attach")),order:1,tone:"steady"},{id:"waiting",title:"WAITING items",subtitle:"Parked rows stay visible but no longer pollute the execution lane.",selector:R("WAIT","WAITING"),order:8,tone:"waiting"},{id:"someday",title:"Closed / Review Tail",subtitle:"Recent DONE/CLOSED rows are sorted near the end for review context.",selector:O(P,I),order:9,tone:"done"}]}),strict:b({key:"strict",label:"Strict Consume Pipeline",shortLabel:"Strict",description:"Shows discard and take semantics explicitly before emitting final sections.",intent:"Use org-super-agenda as an explicit narrowing workflow instead of a decorative sorter.",rules:[{id:"discard-done",title:"Discard completed rows",subtitle:"Consumes DONE/CLOSED before the rest of the pipeline sees them.",selector:{kind:"discard",selector:O(P,I)},order:-3,tone:"done"},{id:"take-pressure",title:"Take first 3 pressure rows",subtitle:"A bounded working set: deadlines, blockers, and priority A win.",selector:{kind:"take",count:3,selector:O(D,j,T("<=","A"))},order:-2,tone:"critical"},{id:"quick-effort",title:"Small effort wins",subtitle:"Effort-aware rows at or below one hour become quick execution candidates.",selector:{kind:"effort",operator:"<=",value:"1h"},order:-1,tone:"focus"},{id:"ordered-front",title:"ORDERED project front",subtitle:"Parser-owned blocker edges expose the first actionable child.",selector:A(j,N("ID")),order:0,tone:"critical"},{id:"waiting",title:"Waiting state",subtitle:"Rows intentionally blocked by human or external dependency.",selector:R("WAIT","WAITING"),order:8,orderMulti:"tail-review",tone:"waiting"},{id:"scheduled",title:"Remaining scheduled work",subtitle:"Everything scheduled after the narrowing rules has run.",selector:{kind:"scheduled"},order:8,orderMulti:"tail-review",tone:"steady"}]}),auto:b({key:"auto",label:"Auto Grouping",shortLabel:"Auto",description:"Turns parser metadata into generated agenda sections.",intent:"Use :auto-* selectors as first-class UI structure, not hidden implementation detail.",rules:[{id:"auto-priority",title:"Priority",subtitle:"Creates generated sections from parsed priority cookies and agenda sort keys.",selector:E("priority"),order:-1,tone:"critical"},{id:"auto-area",title:"AREA",subtitle:"Creates one section for each AREA property value.",selector:E("property","AREA"),order:0,tone:"focus"},{id:"auto-todo",title:"TODO keyword",subtitle:"Remaining rows are grouped by TODO state.",selector:E("todo"),order:3,tone:"steady"},{id:"auto-tags",title:"Tag signature",subtitle:"Rows with the same effective tag set collapse into the same section.",selector:E("tags"),order:5,tone:"waiting"},{id:"auto-planning",title:"Planning date",subtitle:"Date buckets mirror :auto-planning for any remaining rows.",selector:E("planning"),order:7,tone:"deadline"}]}),agent:b({key:"agent",label:"Agent Context Agenda",shortLabel:"Agent",description:"Connects agenda evidence with AI-ready context packs.",intent:"Bridge agenda grouping, parser receipts, and LLM handoff prompts without hiding rules.",rules:[{id:"agent-risk",title:"Risk handoff",subtitle:"Deadlines and blockers become the first agent brief.",selector:A(O(D,j),{kind:"not",selector:R("WAIT","WAITING")}),order:-1,tone:"critical"},{id:"agent-memory",title:"Memory-backed records",subtitle:"Rows with stable IDs, record tags, or parser receipts are useful prompt context.",selector:O(M,N("ID"),L("record","memory")),order:0,tone:"focus",transformer:"agent-context-label"},{id:"agent-attachment",title:"Attachment / artifact rows",subtitle:"Attachment and research rows are separated for retrieval-aware follow-up.",selector:O(L("attach","research"),N("DIR")),order:2,tone:"waiting"},{id:"agent-log",title:"Progress log source",subtitle:"DONE/CLOSED rows supply recent progress memory.",selector:O(P,I),order:8,tone:"done"}]})};Object.fromEntries(Object.entries(F).map(e=>{let[t,a]=e;return[t,{label:a.shortLabel,description:a.description}]}));let q=[_("anything",":anything","Catch all","core","native","Catch-all selector used for Other items and terminal discard rules."),_("deadline",":deadline","Deadline rows","core","parser-backed","Backed by agendaView kind=deadline from native Org planning."),_("scheduled",":scheduled","Scheduled rows","core","parser-backed","Backed by agendaView kind=scheduled."),_("time-grid",":time-grid","Timed rows","core","parser-backed","Backed by parsed Org timestamps with start/end time."),_("todo",":todo","TODO keyword","core","parser-backed","Uses parsed TODO keyword and done/todo state."),_("tag",":tag","Effective tags","core","parser-backed","Uses inherited effectiveTags from the parser DTO."),_("category",":category","Category","core","parser-backed","Available from agendaView category when present."),_("property",":property","Property drawer","core","parser-backed","Matches parsed Org property drawer values such as AREA, ID, DIR, EFFORT."),_("log",":log closed","Closed log","core","partial","Closed rows are available; full agenda log-mode clock separation is not wired yet."),_("children",":children","ORDERED blockers","core","agent-extension","Org Zhixing exposes parser-owned blocker chains instead of recomputing children in TS."),_("implicit-or","implicit OR","Selector OR","control","native","Multiple selector clauses in a rule are treated as an org-super-agenda OR group."),_("and",":and","Intersection","control","native","All nested selectors must match before the rule consumes the item."),_("not",":not","Negation","control","native","Inverts nested selector matches and composes with discard."),_("discard",":discard","Consume without section","control","native","Matched rows are consumed and do not produce a visible group."),_("take",":take","Bounded group","control","native","Emits first N matched rows and hides the rest from downstream selectors."),_("order",":order","Section order","control","native","Groups are sorted by explicit order, then section name."),_("order-multi",":order-multi","Shared order","control","native","Program source emits shared order blocks and the UI keeps each compiled section interactive."),_("auto-category",":auto-category","Auto category","auto","native","Execution engine can bucket remaining rows by category."),_("auto-planning",":auto-planning","Auto planning","auto","native","Buckets rows by display planning date."),_("auto-property",":auto-property","Auto property","auto","native","Buckets rows by a selected property such as AREA."),_("auto-tags",":auto-tags","Auto tags","auto","native","Buckets rows by exact effective tag signature."),_("auto-todo",":auto-todo","Auto TODO","auto","native","Buckets rows by parsed TODO keyword."),_("auto-group",":auto-group","agenda-group property","auto","partial",'Can be expressed as :auto-property "agenda-group"; inheritance policy is still parser-dependent.'),_("auto-priority",":auto-priority","Auto priority","auto","native","Buckets remaining rows by parsed priority cookies exposed through agenda sort keys."),_("auto-outline-path",":auto-outline-path","Outline path","auto","planned","The view index has outline strings; agenda cards still need stable outline-path linkage."),_("auto-parent",":auto-parent","Parent heading","auto","planned","Requires parent identity in agenda DTO rather than title-only inference."),_("auto-ts",":auto-ts","Latest timestamp","auto","planned","Requires a latest-timestamp projection beyond scheduled/deadline/closed."),_("auto-map",":auto-map","Custom grouping function","auto","planned","Will need a safe typed callback model, not arbitrary browser eval."),_("face",":face","Visual face","display","partial","Program metadata is preserved and group chrome exposes the token."),_("transformer",":transformer","Item transformer","display","native","Safe typed transformers can relabel card titles without arbitrary browser eval."),_("priority",":priority","Priority selector","advanced","parser-backed","Matches priority cookies from agenda sort keys with typed A/B/C comparison."),_("effort",":effort<= / :effort>=","Effort compare","advanced","parser-backed","Parses EFFORT properties into minutes before comparing selector thresholds."),_("heading-regexp",":heading-regexp","Heading regexp","advanced","planned","Title text is available, but regexp UI needs safe authoring."),_("regexp",":regexp","Agenda row regexp","advanced","planned","Full row string matching should be backed by a stable rendered row contract."),_("pred",":pred","Predicate","advanced","planned","Arbitrary predicates are intentionally deferred for safety and portability."),_("file-path",":file-path","File path","advanced","planned","Needs source-file identity on agenda cards."),_("habit",":habit","Habit","advanced","planned","Requires native habit metadata from the parser."),_("agent-memory","agent:memory","AI memory signal","agent","agent-extension","Org Zhixing adds stable ID, receipts, and memory tags as agent-ready selectors.")];function _(e,t,a,r,n,l){return{id:e,selector:t,label:a,family:r,status:n,detail:l}}let U=(e,t)=>{switch(t.add(W(e)),e.kind){case"and":case"or":e.selectors.forEach(e=>U(e,t));break;case"not":case"take":case"discard":U(e.selector,t);break;case"auto":"property"===e.by&&"agenda-group"===e.property&&t.add("auto-group")}},W=e=>{switch(e.kind){case"auto":return`auto-${e.by}`;case"blocked":return"children";case"closed":return"log";case"done":return"todo";case"memory":return"agent-memory";case"or":return"implicit-or";case"time-grid":return"time-grid";default:return e.kind}},B=(e,t,a,r)=>({ruleId:e.id,title:e.title,selector:t,order:e.order,tone:e.tone,operation:a,matchedCount:r.matchedCount,emittedCount:r.emittedCount,consumedCount:r.consumedCount,discardedCount:r.discardedCount,inputCount:r.beforeCount,remainingAfter:r.remainingAfter,outputTitles:r.outputTitles,note:`${r.note} ${r.beforeCount} in -> ${r.remainingAfter} remain.`}),V=(e,t,a)=>({id:a?`${e.id}-${eo(a)}`:e.id,ruleId:e.id,title:a?`${e.title}: ${a}`:e.title,subtitle:z(t,e,a),selector:$(e.selector),order:e.order,tone:Y(t,e.tone),autoKey:a,face:e.face,transformer:e.transformer,cards:t}),z=(e,t,a)=>{let r=e.filter(e=>e.time).length,n=e.filter(e=>"deadline"===e.kind).length,l=e.filter(e=>e.blockers.length>0).length;return[`${e.length} consumed`,a?`auto key ${a}`:t.subtitle,r>0?`${r} timed`:null,n>0?`${n} deadline`:null,l>0?`${l} blocked`:null].filter(Boolean).join(" / ")},G=(e,t)=>{switch(t.kind){case"anything":return!0;case"blocked":return e.blockers.length>0;case"category":return el(t.values,e.category);case"closed":return"closed"===e.kind;case"deadline":return"deadline"===e.kind;case"done":return"closed"===e.kind||"done"===e.todoState;case"memory":return e.memorySignals.length>0||e.receipts.length>0;case"effort":return Q(e,t.operator,t.value);case"priority":return Z(e,t.operator,t.value);case"property":return H(e,t.key,t.values);case"scheduled":return"scheduled"===e.kind;case"tag":return t.values.some(t=>e.effectiveTags.some(e=>ei(e)===ei(t)));case"time-grid":return!!e.time;case"todo":return el(t.values,e.todo);case"and":return t.selectors.every(t=>G(e,t));case"not":return!G(e,t.selector);case"or":return t.selectors.some(t=>G(e,t));case"take":case"discard":return G(e,t.selector);case"auto":return!!K(e,t)}},H=(e,t,a)=>{let r=X(e,t);return!!r&&(!a||0===a.length||el(a,r))},Q=(e,t,a)=>{let r=J(e),n=ee(a);return null!==r&&null!==n&&en(r,t,n)},Z=(e,t,a)=>{let r=er(et(e)),n=er(ea(a));return null!==r&&null!==n&&en(r,t,n)},K=(e,t)=>{switch(t.by){case"category":return e.category??null;case"planning":return e.displayDate||null;case"priority":return et(e);case"property":return t.property?X(e,t.property):null;case"tags":return e.effectiveTags.length>0?e.effectiveTags.map(e=>`#${e}`).sort().join(" "):null;case"todo":return e.todo??null}},Y=(e,t)=>["critical","deadline","focus","waiting","done"].find(t=>e.some(e=>e.pressure===t))??t,X=(e,t)=>e.record?.properties.find(e=>e.key===t)?.value??null,J=e=>ee(X(e,"EFFORT")),ee=e=>{if(!e)return null;let t=e.trim().toLowerCase(),a=t.match(/^(\d+):(\d{1,2})$/);if(a)return 60*Number(a[1])+Number(a[2]);let r=t.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)$/);if(r){let e=Number(r[1]);return r[2].startsWith("h")?60*e:e}return t.match(/^\d+(?:\.\d+)?$/)?Number(t):null},et=e=>ea(e.sortKeys.find(e=>"priority"===e.key)?.value??null)??ea(e.title),ea=e=>{if(!e)return null;let t=e.trim(),a=t.match(/\[#([A-Z])\]/i);if(a)return a[1].toUpperCase();let r=t.match(/(?:^|\b)([A-Z])(?:\b|$)/i);if(r)return r[1].toUpperCase();let n=Number(t);return Number.isInteger(n)&&n>=65&&n<=90?String.fromCharCode(n):null},er=e=>e&&/^[A-Z]$/.test(e)?e.charCodeAt(0)-64:null,en=(e,t,a)=>{switch(t){case"<=":return e<=a;case"=":return e===a;case">=":return e>=a}},el=(e,t)=>!!t&&e.some(e=>ei(e)===ei(t??"")),ei=e=>e.trim().toLowerCase(),eo=e=>e.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48),es=e=>[ed("SCHEDULED","scheduled",e?.planning.scheduled),ed("DEADLINE","deadline",e?.planning.deadline),ed("CLOSED","closed",e?.planning.closed)].filter(e=>null!==e),ed=(e,t,a)=>{let r="string"==typeof a?a:a&&"object"==typeof a&&"raw"in a&&"string"==typeof a.raw?a.raw:"";return r?{label:e,kind:t,value:r}:null},ec=(e,t)=>[e.todo,e.category,e.time?`${e.time}${e.endTime?`-${e.endTime}`:""}`:null,...e.effectiveTags.map(e=>`#${e}`),...(t?.properties??[]).filter(e=>["AREA","EFFORT","KIND","ID","DIR"].includes(e.key)).map(e=>`${e.key}: ${e.value}`)].filter(e=>!!e),eu=(e,t)=>{let a=e.effectiveTags.map(e=>e.toLowerCase());return[a.includes("record")?"record":null,a.includes("blog")?"blog":null,a.includes("attach")?"attachment":null,a.includes("memory")?"memory":null,t?.properties.some(e=>"ID"===e.key)?"stable ID":null,t?.properties.some(e=>"KIND"===e.key)?"typed record":null,t?.properties.some(e=>"AREA"===e.key)?"area context":null].filter(e=>!!e)},eg=e=>e.blockers.length>0?"critical":"deadline"===e.kind?"deadline":e.time?"focus":"closed"===e.kind||"done"===e.todoState?"done":"WAIT"===e.todo||"WAITING"===e.todo?"waiting":"steady",ep=(e,t)=>e.blockers.length>0?"unblock brief":"deadline"===e.kind?"risk brief":e.time?"execution brief":eu(e,t).length>0?"memory context":"agenda context",em=(e,t,a)=>e?`Unblock ${e.title}`:t?`Watch ${t.title}`:a?`Start with ${a.title}`:"Agenda context is ready",eh=e=>e.filter(e=>e.memorySignals.length>0||e.receipts.length>0||e.blockers.length>0).slice(0,8).map(e=>({title:e.title,label:e.memorySignals.length>0?e.memorySignals.join(" / "):e.agentState,detail:e.receipts[0]?.message??`${e.kind} on ${e.displayDate}`,tone:e.pressure})),ef=e=>({label:ev(e.key),direction:e.direction,detail:ey(e.key)}),ev=e=>({displayDate:"Planning date",time:"Time grid",kind:"Agenda kind",level:"Outline depth",title:"Title",targetDate:"Target date",scheduledDate:"Scheduled date",deadlineDate:"Deadline date",priority:"Priority",category:"Category",todoState:"TODO state"})[e]??e,ey=e=>({displayDate:"daily and weekly agenda order",time:"keeps timed rows close to execution",kind:"separates scheduled, deadline, and closed rows",level:"preserves outline hierarchy pressure",title:"stable alphabetical fallback",targetDate:"normalizes timestamp targets",scheduledDate:"scheduled timestamp evidence",deadlineDate:"deadline timestamp evidence",priority:"Org priority signal",category:"source category signal",todoState:"stateful completion signal"})[e]??"parser sort signal",e$=e=>e.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1").replace(/\s+/g," ").trim(),eb=(e,t,a)=>`
  <button
    type="button"
    role="tab"
    aria-selected="${e===a}"
    data-agenda-panel="${e}"
    class="${e===a?"active":""}"
  >
    ${eT(t)}
  </button>
`,ew=(e,t)=>`
  <section class="agenda-panel-card agenda-trace">
    <div class="agenda-section-heading">
      <span>Selector execution</span>
      <strong>${e.visibleCount} input rows</strong>
    </div>
    <ol>
      ${e.trace.map((e,a)=>`
            <li
              class="trace-step trace-step--${e.tone} ${e.ruleId===t?"trace-step--selected":""}"
              data-agenda-trace-rule="${eT(e.ruleId)}"
            >
              <details ${a<3?"open":""}>
                <summary data-agenda-rule-select="${eT(e.ruleId)}">
                  <span class="selector-index">${a+1}</span>
                  <code>${eT(e.selector)}</code>
                  <b>${eT(e.operation)}</b>
                </summary>
                <div class="trace-step-body">
                  <strong>${eT(e.title)}</strong>
                  <p>${eT(e.note)}</p>
                  <dl>
                    <div><dt>matched</dt><dd>${e.matchedCount}</dd></div>
                    <div><dt>emitted</dt><dd>${e.emittedCount}</dd></div>
                    <div><dt>consumed</dt><dd>${e.consumedCount}</dd></div>
                    <div><dt>discarded</dt><dd>${e.discardedCount}</dd></div>
                    <div><dt>input</dt><dd>${e.inputCount}</dd></div>
                    <div><dt>remain</dt><dd>${e.remainingAfter}</dd></div>
                    <div><dt>order</dt><dd>${e.order}</dd></div>
                  </dl>
                  ${ek(e.outputTitles)}
                </div>
              </details>
            </li>
          `).join("")}
    </ol>
  </section>
`,ek=e=>0===e.length?'<p class="trace-empty">No visible section emitted.</p>':`<div class="trace-output">${e.slice(0,6).map(e=>`<span>${eT(e)}</span>`).join("")}</div>`,eS=e=>`
  <section class="agenda-panel-card agenda-selector-coverage">
    <div class="agenda-section-heading">
      <span>Super-agenda selector coverage</span>
      <strong>${e.capabilitySummary.implemented}/${e.capabilitySummary.total} modeled</strong>
    </div>
    <dl class="selector-coverage-summary">
      <div><dt>active</dt><dd>${e.capabilitySummary.active}</dd></div>
      <div><dt>planned</dt><dd>${e.capabilitySummary.planned}</dd></div>
      <div><dt>program</dt><dd>${eT(e.program.shortLabel)}</dd></div>
    </dl>
    <div class="selector-capability-stack">
      ${eC(e,"control","Control flow")}
      ${eC(e,"core","Core selectors")}
      ${eC(e,"auto","Auto groups")}
      ${eC(e,"display","Faces and transforms")}
      ${eC(e,"agent","Org Zhixing extensions")}
      ${eC(e,"advanced","Advanced backlog")}
    </div>
  </section>
`,eC=(e,t,a)=>{let r=e.selectorCapabilities.filter(e=>e.family===t);return 0===r.length?"":`
    <details class="selector-capability-family" ${"advanced"!==t?"open":""}>
      <summary>
        <span>${eT(a)}</span>
        <b>${r.filter(e=>e.active).length}/${r.length}</b>
      </summary>
      <ol>
        ${r.map(ex).join("")}
      </ol>
    </details>
  `},ex=e=>`
  <li class="selector-capability selector-capability--${e.status} ${e.active?"selector-capability--active":""}">
    <div>
      <code>${eT(e.selector)}</code>
      <strong>${eT(e.label)}</strong>
      <p>${eT(e.detail)}</p>
    </div>
    <span>${eT(e.active?"active":e.status)}</span>
  </li>
`,eA=e=>`
  <section class="agenda-panel-card agenda-program-source">
    <div class="agenda-section-heading">
      <span>Executable shape</span>
      <strong>${e.program.rules.length} rules</strong>
    </div>
    <pre><code>${eT(e.program.source)}</code></pre>
    <div class="agenda-source-grid">
      <section>
        <h3>Sort strategy</h3>
        <ol>
          ${e.sortSteps.map((e,t)=>`
                <li>
                  <b>${t+1}</b>
                  <span>${eT(e.label)}</span>
                  <small>${eT(e.direction)} / ${eT(e.detail)}</small>
                </li>
              `).join("")}
        </ol>
      </section>
      <section>
        <h3>Runtime result</h3>
        <dl>
          <div><dt>visible</dt><dd>${e.visibleCount}</dd></div>
          <div><dt>consumed</dt><dd>${e.consumedCount}</dd></div>
          <div><dt>discarded</dt><dd>${e.discardedCount}</dd></div>
          <div><dt>unmatched</dt><dd>${e.unmatchedCount}</dd></div>
        </dl>
      </section>
    </div>
  </section>
`,eE=e=>`
  <section class="agenda-panel-card agenda-agent-panel">
    <div class="agenda-section-heading">
      <span>AI handoff from compiled agenda</span>
      <strong>${eT(e.program.shortLabel)}</strong>
    </div>
    <h3>${eT(e.agentBrief.headline)}</h3>
    <p>${eT(e.agentBrief.summary)}</p>
    <ol class="agenda-agent-actions">
      ${e.agentBrief.recommendations.map((e,t)=>`
            <li>
              <b>${t+1}</b>
              <span>${eT(e)}</span>
            </li>
          `).join("")}
    </ol>
    <div class="agenda-prompt-stack">
      ${e.agentBrief.prompts.map((e,t)=>`
            <details ${0===t?"open":""}>
              <summary>Prompt ${t+1}</summary>
              <p>${eT(e)}</p>
            </details>
          `).join("")}
    </div>
  </section>
`,eO=e=>`
  <section class="agenda-panel-card agenda-capture-log">
    <div class="agenda-section-heading">
      <span>Record trail</span>
      <strong>${e.agentBrief.captureLog.length}</strong>
    </div>
    <ol>
      ${e.agentBrief.captureLog.map(e=>`
            <li class="capture-entry capture-entry--${e.tone}">
              <strong>${eT(e.title)}</strong>
              <span>${eT(e.label)}</span>
              <small>${eT(e.detail)}</small>
            </li>
          `).join("")}
    </ol>
  </section>
`,eT=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),eN=(e,t)=>{if("done"===t)return"done";let a=e?.toLowerCase()??"";return["wait","waiting","hold","blocked"].includes(a)?"waiting":["next","today","review"].includes(a)?"focus":"todo"},eL=(e,t)=>e?`<span class="org-heading-todo org-heading-todo--${eN(e,t)}">${eD(e)}</span>`:"",eR=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},a=e.filter(Boolean);if(0===a.length)return"";let r=["org-meta-row",t.rowClassName].filter(Boolean).join(" ");return`<div class="${r}">${a.join("")}</div>`},ej=e=>e.filter(e=>!!e).map(e=>`<span class="org-meta-tag">${eD(e)}</span>`),eI=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return eR(ej(e),{rowClassName:["org-meta-row--tags",t.rowClassName].filter(Boolean).join(" ")})},eD=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),eP=e=>`
  <div class="agenda-metric agenda-metric--${e.tone}">
    <dt>${eQ(e.label)}</dt>
    <dd>${eQ(e.value)}</dd>
    <small>${eQ(e.detail)}</small>
  </div>
`,eM=e=>`
  <details class="agenda-group-handoff">
    <summary>agent handoff</summary>
    <div>
      <p>${eQ(eF(e))}</p>
      <div class="agenda-signal-row agenda-signal-row--compact">
        ${e.cards.slice(0,4).map(e=>`<span>${eQ(e.title)}</span>`).join("")}
      </div>
    </div>
  </details>
`,eF=e=>`Use selector ${e.selector} as the agenda boundary. Summarize ${e.cards.length} rows in "${e.title}". Preserve parser receipts, blockers, source lines, and memory signals. Return next actions, waiting reasons, and record updates separately.`,eq=(e,t)=>`
  <article class="agenda-row agenda-row--${e.pressure}">
    <div class="agenda-row-time">
      <span class="agenda-kind ${eQ(e.kind)}">${eQ(e.kind)}</span>
      <strong>${eQ(e.displayDate)}</strong>
      <small>${e.time?`${eQ(e.time)}${e.endTime?`-${eQ(e.endTime)}`:""}`:`#${e.sortedPosition}`}</small>
    </div>
    <div class="agenda-row-main">
      <h3 class="agenda-row-title">${eW(e)}<span class="agenda-row-title-text">${eQ(e_(e,t))}</span></h3>
      <p>${eQ(e.agentState)}</p>
      ${eU(e)}
      <div class="agenda-signal-row agenda-signal-row--compact">
        ${e.signals.slice(0,9).map(e=>`<span>${eQ(e)}</span>`).join("")}
      </div>
      ${ez(e)}
    </div>
    <details class="agenda-row-evidence">
      <summary>evidence</summary>
      <div class="agenda-evidence-grid">
        ${eB(e)}
        ${eV(e)}
      </div>
    </details>
  </article>
`,e_=(e,t)=>{switch(t){case"agent-context-label":return`[CONTEXT] ${e.title}`;case"deadline-risk-label":return`[RISK] ${e.title}`;case"uppercase-title":return e.title.toUpperCase();case void 0:return e.title}},eU=e=>0===e.planning.length?"":`
    <div class="agenda-planning-row">
      ${e.planning.map(e=>`
  <span class="org-meta-chip org-planning-chip org-planning-chip--${e.kind} org-meta-chip--${e.kind}">
    <b class="org-planning-label">${eD(e.label)}</b>
    <span class="org-timestamp org-timestamp--raw">${eD(e.value)}</span>
  </span>
`).join("")}
    </div>
  `,eW=e=>{let t=[eL(e.todo,e.todoState)].filter(Boolean).join("");return t?`<span class="agenda-title-markers org-heading-markers">${t}</span>`:""},eB=e=>`
  <section class="agenda-receipt-rail">
    <div class="agenda-mini-heading">
      <strong>Receipts</strong>
      <span>${e.receipts.length}</span>
    </div>
    <ul>
      ${e.receipts.slice(0,4).map(e=>`<li>${eQ(e.message)}</li>`).join("")}
    </ul>
  </section>
`,eV=e=>`
  <section class="agenda-memory-rail">
    <div class="agenda-mini-heading">
      <strong>Context</strong>
      <span>${e.memorySignals.length}</span>
    </div>
    <p>Source line ${e.source.start.line}</p>
    <div class="agenda-signal-row agenda-signal-row--compact">
      ${[...e.memorySignals,...e.sortKeys.slice(0,4).map(e=>`${e.key}: ${e.value}`)].map(e=>`<span>${eQ(e)}</span>`).join("")}
    </div>
  </section>
`,ez=e=>0===e.blockers.length?"":`<div class="agenda-blockers">${e.blockers.map(e=>`<span>${eQ(e.message)}: ${eQ(e.blocker.title)}</span>`).join("")}</div>`,eG=e=>`
  <li>
    <strong>${eQ(eH(e.title))}</strong>
    <span>${eQ(e.reason)}</span>
    <small>sorted #${e.sortedPosition}</small>
  </li>
`,eH=e=>e.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1").replace(/\s+/g," ").trim(),eQ=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),eZ=e=>e?.split("/").pop()??"the current Org source",eK=e=>"image"===e.mediaKind&&!1!==e.publicExists;var eY=a(7187);let eX=(e,t)=>(0,eY.Vo)(eJ(e,t)).toString(),eJ=(e,t)=>{let a=e0(e.directoryPath),r=e2(a,e0(e.linkPath)),n=t?e0(t).split("/")[0]:"";return!t||n&&a.startsWith(`${n}/`)?r:e2(e3(t),r)},e0=e=>e4(e).join("/"),e1=e=>e0(e).split("/").filter(Boolean).at(-1)??"",e3=e=>{let t=e0(e),a=t.lastIndexOf("/");return -1===a?"":t.slice(0,a)},e2=function(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return t.flatMap(e4).join("/")},e4=e=>{let t=e.split("/").filter(e=>e.length>0&&"."!==e),a=t.lastIndexOf("public");return -1===a?t:t.slice(a+1)},e6=e=>{if(!e)return'<div class="empty">Loading attachment gallery...</div>';let{records:t}=e;return 0===t.length?`
      <section class="attachment-gallery" aria-label="Attachment gallery">
        ${e9(e)}
        <div class="empty">${tr(ta(e))}</div>
      </section>
    `:`
    <section class="attachment-gallery" aria-label="Attachment gallery">
      ${e9(e)}
      <div class="attachment-grid">
        ${t.map((e,t)=>e8(e,t)).join("")}
      </div>
    </section>
  `},e9=e=>`
  <header class="attachment-gallery-header">
    <div>
      <p class="eyebrow">Org attachments</p>
      <h2>Attachment gallery</h2>
      <p>${tr(tt(e))}</p>
    </div>
    <dl class="attachment-metrics" aria-label="Attachment gallery metrics">
      <div><dt>Display</dt><dd>${e.records.length}</dd></div>
      <div><dt>Images</dt><dd>${e.records.length}</dd></div>
      <div><dt>Records</dt><dd>${e.entryCount}</dd></div>
      <div><dt>Sources</dt><dd>${e.sourceCount}</dd></div>
    </dl>
  </header>
`,e8=(e,t)=>{let{record:a,sourceFile:r,sourceName:n}=e,l=e7(a)||e1(a.linkPath)||"Attachment",i=te(a).join(" / ")||a.directoryPath,o=eX(a,r),s=[...new Set(a.effectiveTags)].slice(0,5);return`
    <article class="attachment-card">
      <a
        href="${tr(o)}"
        data-attachment-open
        data-attachment-index="${t}"
        data-attachment-kind="${tr(a.mediaKind)}"
        data-attachment-title="${tr(l)}"
        data-attachment-outline="${tr(i)}"
        data-cropped="true"
        target="_blank"
        rel="noreferrer"
      >
        ${e5(a,o,l)}
        <div class="attachment-card-body">
          <span>${tr(a.mediaKind)}</span>
          <h3>${tr(l)}</h3>
          <p>${tr(`${n} / ${i}`)}</p>
          ${eI(s,{rowClassName:"meta-row"})}
        </div>
      </a>
    </article>
  `},e5=(e,t,a)=>"image"===e.mediaKind?`<img src="${tr(t)}" alt="${tr(a)}" loading="lazy" decoding="async" data-attachment-thumbnail>`:`<div class="attachment-file-preview">${tr(e.mediaKind.toUpperCase())}</div>`,e7=e=>e.sectionTitleText??e.sectionTitle,te=e=>e.outlinePathText??e.outlinePath,tt=e=>{let t=e.siteWide?`across ${e.label}`:`in ${e.label}`;return`${e.records.length} image items from ${e.entryCount} semantic attachment records ${t}.`},ta=e=>e.siteWide?"No image attachments found in configured Org sources.":"No image attachments found in this Org source.",tr=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),tn=(e,t,a)=>{let r=tl(t,a);if(0!==r.size)for(let t of e.querySelectorAll("a[href^='attachment:'],img[src^='attachment:']")){let e=t instanceof HTMLImageElement?"src":"href",a=ti(t.getAttribute(e)),n=a?r.get(a):void 0;n&&(t.setAttribute(e,n),t instanceof HTMLAnchorElement&&(t.target="_blank",t.rel="noreferrer"))}},tl=(e,t)=>{let a=new Map;for(let r of(0,g.sn)(e)){let e=e1(r.linkPath);!e||a.has(e)||a.set(e,eX(r,t))}return a},ti=e=>{if(!e?.startsWith("attachment:"))return null;let[t]=e.slice(11).split("::",1);try{return e1(decodeURIComponent(t))}catch{return e1(t)}},to=new Set(["www.youtube.com","youtube.com","www.youtube-nocookie.com","youtube-nocookie.com","maps.google.com","www.google.com"]),ts=e=>{for(let t of e.querySelectorAll("iframe")){let e=t.getAttribute("src");if(!e||!td(e)){t.remove();continue}t.setAttribute("loading","lazy"),t.setAttribute("referrerpolicy","strict-origin-when-cross-origin"),t.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation"),t.getAttribute("title")||t.setAttribute("title",tg(e))}},td=e=>{try{let t=new URL(e);if("https:"!==t.protocol||!to.has(t.hostname))return!1;return tc(t)||tu(t)}catch{return!1}},tc=e=>/(^|\.)youtube(?:-nocookie)?\.com$/.test(e.hostname)&&/^\/embed\/[A-Za-z0-9_-]+$/.test(e.pathname),tu=e=>"maps.google.com"===e.hostname&&"/maps"===e.pathname||"www.google.com"===e.hostname&&e.pathname.startsWith("/maps/embed"),tg=e=>{let t=new URL(e);return tc(t)?"YouTube video":tu(t)?"Google Maps preview":"Embedded content"},tp=(e,t,a)=>{let r=t?.raw||a,n=e.createElement(t?.start?"time":"span");return n.className=`org-timestamp org-timestamp--${t?.kind??"raw"}`,n.textContent=r,t?.start&&n.setAttribute("datetime",tm(t)),t?.isRange&&(n.dataset.orgRange="true"),n},tm=e=>{let t=e.start;if(!t)return e.raw;let a=[t.year,t.month,t.day].map((e,t)=>0===t?String(e):String(e).padStart(2,"0")).join("-");return null===t.hour||void 0===t.hour?a:`${a}T${String(t.hour).padStart(2,"0")}:${String(t.minute??0).padStart(2,"0")}`},th=(e,t)=>{let a=tf(t);if(0===a.length)return;let r=new Set;for(let t of e.querySelectorAll("h1,h2,h3,h4,h5,h6")){let e=tv(t,a,r);e&&tk(e)&&(r.add(e),tA(t),t.insertAdjacentElement("afterend",ty(e)))}},tf=e=>e.semanticSections.map(e=>e),tv=(e,t,a)=>{let r=tT(e.textContent??""),n=tN(e);return(r.length>0?t.find(e=>!a.has(e)&&tT(tE(e))===r&&n>=Math.min(e.level,6))??t.find(e=>!a.has(e)&&tT(tE(e))===r):null)??t.find(e=>!a.has(e)&&n>=Math.min(e.level,6))??null},ty=e=>{let t=document.createElement("div");return t.className="org-section-meta",t.append(t$(e),tb(e),tw(e)),t},t$=e=>{let t=document.createElement("div");for(let a of(t.className="org-meta-row org-meta-row--planning",tS(e))){let e=document.createElement("span"),r=a.label.toLowerCase();e.className=`org-meta-chip org-planning-chip org-planning-chip--${r} org-meta-chip--${r}`;let n=document.createElement("b");n.className="org-planning-label",n.textContent=a.label,e.append(n,tp(document,a.timestamp,a.value)),t.append(e)}return t},tb=e=>{let t=document.createElement("div");for(let a of(t.className="org-meta-row org-meta-row--tags",e.effectiveTags.filter(e=>e.length>0).slice(0,8))){let e=document.createElement("span");e.className="org-meta-tag",e.textContent=a,t.append(e)}return t},tw=e=>{let t=document.createElement("dl");for(let a of(t.className="org-meta-row org-meta-row--properties",tx(e).slice(0,6))){let e=document.createElement("div"),r=document.createElement("dt"),n=document.createElement("dd");r.textContent=a.key,n.textContent=a.value,e.append(r,n),t.append(e)}return t},tk=e=>tS(e).length>0||e.effectiveTags.length>0||tx(e).length>0,tS=e=>[tC("SCHEDULED",e.planning.scheduled),tC("DEADLINE",e.planning.deadline),tC("CLOSED",e.planning.closed)].filter(e=>null!==e),tC=(e,t)=>{let a="string"==typeof t?t:t&&"object"==typeof t&&"raw"in t&&"string"==typeof t.raw?t.raw:"";return a?{label:e,timestamp:t&&"object"==typeof t&&"kind"in t?t:null,value:a}:null},tx=e=>e.properties.filter(e=>"ID"!==e.key.toUpperCase()),tA=e=>{let t=e.nextElementSibling,a=t?.tagName.toLowerCase()==="section"?t.querySelector("p:first-child"):t;a&&"p"===a.tagName.toLowerCase()&&/^\s*(SCHEDULED|DEADLINE|CLOSED):/.test(a.textContent??"")&&a.remove()},tE=e=>e.titleText??tO(e.title),tO=e=>e.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1"),tT=e=>e.replace(/\s+/g," ").replace(/\u00a0/g," ").trim(),tN=e=>Number(e.tagName.replace(/^H/i,""))||1,tL=(e,t)=>e.properties.filter(e=>["ID","CUSTOM_ID"].includes(e.key.toUpperCase())).map(e=>[e.value.trim(),t]).filter(e=>{let[t]=e;return t.length>0}),tR=e=>{try{return decodeURIComponent(e)}catch{return e}},tj=(e,t)=>{tI(e,t),tP(e),tq(e),tW(e),tG(e)},tI=(e,t)=>{let a=tf(t);if(0===a.length)return;let r=new Set;for(let t of e.querySelectorAll("h1,h2,h3,h4,h5,h6")){let e=tv(t,a,r);e&&(r.add(e),tD(t,e))}},tD=(e,t)=>{let a;if(e.querySelector(":scope > .org-heading-markers"))return;e.classList.add("org-heading",`org-heading--level-${tN(e)}`);let r=e.ownerDocument.createElement("span");if(r.className="org-heading-markers",t.todo){let a=e.ownerDocument.createElement("span");a.className=`org-heading-todo org-heading-todo--${eN(t.todo,t.todoState)}`,a.textContent=t.todo,r.append(a)}if((a=t.priority).raw||!a.isDefault){let a,n,l=e.ownerDocument.createElement("span");l.className=`org-heading-priority org-priority--${"a"===(a=t.priority.effective.toLowerCase())?"a":"b"===a?"b":"c"}`,n=t.priority,l.textContent=n.raw?.trim()||`#${n.effective}`,r.append(l)}if(0===r.childElementCount)return;let n=e.ownerDocument.createElement("span");for(n.className="org-heading-title";e.firstChild;)n.append(e.firstChild);e.append(r,n)},tP=e=>{for(let t of e.querySelectorAll(".timestamp-wrapper > .timestamp")){if(t.classList.contains("org-timestamp"))continue;let e=(t.textContent??"").trim(),a=t.ownerDocument.createElement(tF(e)?"time":"span");for(let e of t.getAttributeNames())a.setAttribute(e,t.getAttribute(e)??"");a.className=t.className,a.classList.add("org-timestamp",`org-timestamp--${tM(e)}`),a.textContent=e,a.dataset.orgTimestamp="inline";let r=tF(e);r&&a.setAttribute("datetime",r),t.replaceWith(a),a.parentElement?.classList.add("org-timestamp-wrapper")}},tM=e=>e.startsWith("<")?"active":e.startsWith("[")?"inactive":"raw",tF=e=>{let t=/^(\d{4})-(\d{2})-(\d{2})\s+\S+(?:\s+(\d{1,2}):(\d{2}))?/.exec(e.slice(1));if(!t)return null;let[,a,r,n,l,i]=t;return l?`${a}-${r}-${n}T${l.padStart(2,"0")}:${i}`:`${a}-${r}-${n}`},tq=e=>{for(let t of e.querySelectorAll("table")){if(t.closest(".org-table-frame"))continue;t.classList.add("org-native-table"),t.dataset.orgColumns=String(t_(t)),tU(t);let e=t.ownerDocument.createElement("div");e.className="org-table-frame",t.replaceWith(e),e.append(t)}},t_=e=>Math.max(0,...[...e.querySelectorAll("tr")].map(e=>e.querySelectorAll("th,td").length)),tU=e=>{for(let t of e.querySelectorAll("thead td")){let a=e.ownerDocument.createElement("th");for(let e of t.getAttributeNames())a.setAttribute(e,t.getAttribute(e)??"");for(a.setAttribute("scope","col");t.firstChild;)a.append(t.firstChild);t.replaceWith(a)}},tW=e=>{for(let t of e.querySelectorAll("pre")){if(t.closest(".org-block-frame"))continue;let e=t.querySelector("code"),a=e?tB(e):null,r=a?"src":t.classList.contains("example")?"example":"block";t.classList.add("org-native-block",`org-native-block--${r}`),tz(t,tV(r,a))}},tB=e=>{for(let t of e.classList)if(t.startsWith("language-"))return t.slice(9);return null},tV=(e,t)=>"src"===e?t?`SRC \xb7 ${t}`:"SRC":e.toUpperCase(),tz=(e,t)=>{let a=e.ownerDocument.createElement("figure");a.className="org-block-frame";let r=e.ownerDocument.createElement("figcaption");r.className="org-block-name",r.textContent=t,e.replaceWith(a),a.append(r,e)},tG=e=>{for(let t of e.querySelectorAll("li[data-checkbox], li[aria-checked]")){let e=t.dataset.checkbox??t.getAttribute("aria-checked")??"";if(!e||t.querySelector(":scope > .org-checkbox"))continue;t.classList.add("org-checkbox-item",`org-checkbox-item--${e}`);let a=t.ownerDocument.createElement("span");a.className="org-checkbox",a.setAttribute("aria-hidden","true"),a.textContent=tH(e),t.prepend(a)}},tH=e=>["true","checked","on"].includes(e)?"✓":["mixed","partial","indeterminate"].includes(e)?"−":"",tQ=e=>{let{articleHtml:t,articleMessage:a,blogIndex:r,document:n,sourceFile:l,tagFilter:i,timeFilter:o,zenMode:s}=e,d=n?p(n):[];if(!s)return tZ(r??t6(d),i,o);if(!n)return`<div class="empty blog-article-empty">${ac(a||"Loading Org source...")}</div>`;let c=an(t,n,l),u=a||(0===d.length?"No Org file article found in this source.":"Rendering article...");return`
    <section class="blog-reader is-zen" aria-label="Blog reader">
      <div class="blog-zen-progress" data-blog-zen-progress aria-hidden="true">
        <span></span>
      </div>
      ${c.html?`<article class="rendered-html blog-article">${c.html}</article>`:`<div class="empty blog-article-empty">${ac(u)}</div>`}
      ${c.html?'<footer class="blog-zen-end" aria-hidden="true"><span></span><b>End</b><span></span></footer>':""}
    </section>
  `},tZ=(e,t,a)=>{let r=t7(e.articles),n=r.find(e=>e.id===a)??null,l=t?.toLowerCase()??null,i=t5(e.articles,l,n),o=e.tagFacets.filter(e=>i.some(t=>t.effectiveTags.some(t=>t.toLowerCase()===e.tag.toLowerCase()))),s=aa(i,o);return`
    <section class="blog-index" aria-label="Blog index">
      <header class="blog-index-topline">
        <p class="eyebrow">Blog Index</p>
        <p>${ac(t9(e,i.length))}</p>
      </header>
      <div class="blog-index-filterbar">
        ${tX(r,n)}
        ${t0(e.tagFacets,l,e.articleCount)}
      </div>
      ${t3(s,l)}
      ${tK(i)}
    </section>
  `},tK=e=>e.length>0?`<div class="blog-index-list" role="list"${e.length>=120?" data-blog-virtual-list":""}>${e.map(tY).join("")}</div>`:'<div class="empty">No Org articles match this index.</div>',tY=e=>`
  <article role="listitem">
    <button
      type="button"
      class="blog-index-article"
      data-blog-article="${e.rangeStart}"
      ${e.sourceFile?`data-blog-source="${ac(e.sourceFile)}"`:""}
    >
      <span class="blog-index-meta">
        <span>${ac(m(e))}</span>
        <span>${ac(e.sourceName??"Current Org")}</span>
      </span>
      <strong>${ac(e.title)}</strong>
      ${t4(e.effectiveTags)}
      ${e.bodyPreview?`<p>${ac(e.bodyPreview)}</p>`:""}
    </button>
  </article>
`,tX=(e,t)=>e.length>0?`
      <nav class="blog-time-thresholds" aria-label="Blog time thresholds">
        <button type="button" class="blog-time-threshold" data-blog-time="" data-active="${null===t}">
          <span>All</span><small>${e.reduce((e,t)=>e+t.count,0)}</small>
        </button>
        ${e.map(e=>tJ(e,t)).join("")}
      </nav>
    `:"",tJ=(e,t)=>`
  <button
    type="button"
    class="blog-time-threshold"
    data-blog-time="${ac(e.id)}"
    data-active="${t?.id===e.id}"
  >
    <span>${ac(e.label)}</span><small>${e.count}</small>
  </button>
`,t0=(e,t,a)=>e.length>0?`
      <section class="blog-tag-facets" aria-label="Blog tags">
        <button type="button" class="blog-tag-filter" data-blog-tag="" data-active="${null===t}">
          <b>All tags</b><small>${a}</small>
        </button>
        ${e.map(e=>t1(e,t)).join("")}
      </section>
    `:"",t1=(e,t)=>`
  <button
    type="button"
    class="blog-tag-filter"
    data-blog-tag="${ac(e.tag)}"
    data-active="${e.tag.toLowerCase()===t}"
  >
    <b>${ac(e.tag)}</b><small>${e.count}</small>
  </button>
`,t3=(e,t)=>e.length>0?`
      <section class="blog-reasoning-paths" aria-label="Blog association paths">
        ${e.map(e=>t2(e,t)).join("")}
      </section>
    `:"",t2=(e,t)=>`
  <button
    type="button"
    class="blog-reasoning-path"
    data-blog-tag="${ac(e.rootTag)}"
    data-active="${e.rootTag.toLowerCase()===t}"
  >
    <span>${ac(e.rootTag)}</span>
    <small>${ac(e.branchTags.join(" / "))}</small>
    <b>${e.count}</b>
  </button>
`,t4=e=>{let t=e.filter(e=>"blog"!==e.toLowerCase()).slice(0,4);return t.length>0?`<span class="blog-index-tags">${t.map(e=>`<em>${ac(e)}</em>`).join("")}</span>`:""},t6=e=>({articleCount:e.length,articles:e,dateRange:t8(e),sourceCount:1,tagFacets:(e=>{let t=new Map;for(let a of e)for(let e of a.effectiveTags)"blog"!==e.toLowerCase()&&t.set(e,(t.get(e)??0)+1);return[...t.entries()].map(e=>{let[t,a]=e;return{count:a,tag:t}}).sort((e,t)=>t.count-e.count||e.tag.localeCompare(t.tag)).slice(0,10)})(e)}),t9=(e,t)=>{let a=e.dateRange?` \xb7 ${e.dateRange.start} -> ${e.dateRange.end}`:"",r=t===e.articleCount?"":` \xb7 ${t} visible`;return`${e.articleCount} Org files \xb7 ${e.tagFacets.length} tag facets${a}${r}`},t8=e=>{let t=e.map(m).filter(e=>"Article"!==e);return t.length>0?{end:t[0],start:t.at(-1)??t[0]}:null},t5=(e,t,a)=>e.filter(e=>{if(t&&!e.effectiveTags.some(e=>e.toLowerCase()===t))return!1;if(!a)return!0;let r=f(e);return null!==r&&r>=a.startRank&&r<=a.endRank}),t7=e=>{let t=e.map(e=>{let t;return{iso:null===(t=f(e))?null:new Date(t).toISOString().slice(0,10),rank:f(e)}}).filter(e=>null!==e.iso&&null!==e.rank).sort((e,t)=>t.rank-e.rank);if(0===t.length)return[];let a=ae(t);if(a.length<=12)return a;let r=Math.ceil(t.length/12),n=[];for(let e=0;e<t.length;e+=r){let a=t.slice(e,e+r),l=a[0],i=a.at(-1)??l;n.push({count:a.length,endIso:l.iso,endRank:l.rank,id:`${i.iso}..${l.iso}`,label:at(i.iso,l.iso),startIso:i.iso,startRank:i.rank})}return n},ae=e=>{let t=new Map;for(let a of e){let e=t.get(a.iso);e?(e.count+=1,e.startRank=Math.min(e.startRank,a.rank),e.endRank=Math.max(e.endRank,a.rank)):t.set(a.iso,{count:1,endRank:a.rank,startRank:a.rank})}return[...t.entries()].map(e=>{let[t,a]=e;return{count:a.count,endIso:t,endRank:a.endRank,id:t,label:t,startIso:t,startRank:a.startRank}})},at=(e,t)=>e===t?e:`${e} - ${t}`,aa=(e,t)=>t.slice(0,8).map(t=>{let a=e.filter(e=>e.effectiveTags.some(e=>e.toLowerCase()===t.tag.toLowerCase()));return{branchTags:ar(a,t.tag),count:a.length,rootTag:t.tag}}).filter(e=>e.branchTags.length>0),ar=(e,t)=>{let a=t.toLowerCase(),r=new Map;for(let t of e)for(let e of t.effectiveTags){let t=e.toLowerCase();"blog"!==t&&t!==a&&r.set(e,(r.get(e)??0)+1)}return[...r.entries()].sort((e,t)=>t[1]-e[1]||e[0].localeCompare(t[0])).slice(0,3).map(e=>{let[t]=e;return t})},an=(e,t,a)=>al(e,t,a),al=(e,t,a)=>{if(!e)return{html:""};let r=new DOMParser().parseFromString(e,"text/html").body,n=[...r.querySelectorAll("h1,h2,h3,h4,h5,h6")],l=new Set,i=new Map,o=tf(t),s=new Set;for(let e of n){let t=tv(e,o,s);t&&s.add(t);let a=ai(e,t);if(a&&(e.id=as(a,l),t))for(let[a,r]of tL(t,`#${e.id}`))i.set(a,r)}tn(r,t,a);for(let e of r.querySelectorAll('a[href^="id:"]')){let t=tR((e.getAttribute("href")??"").slice(3));e.classList.add("org-id-link"),e.dataset.orgLink="id",e.dataset.orgId=t;let a=i.get(t);a?e.setAttribute("href",a):e.dataset.orgMissingTarget="true"}return ts(r),th(r,t),tj(r,t),{html:r.innerHTML}},ai=(e,t)=>tT(t?tE(t):ao(e.textContent??"")),ao=e=>e.replace(/\s+(:[A-Za-z0-9_@#%]+)+:\s*$/,""),as=(e,t)=>{let a=ad(e)||"section",r=a,n=2;for(;t.has(r);)r=`${a}-${n++}`;return t.add(r),r},ad=e=>e.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,"-").replace(/^-+|-+$/g,""),ac=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),au=(e,t)=>{let a=e.plan.application;return`
    <section class="capture-panel">
      <h3>Application</h3>
      <dl class="capture-kv">
        <div><dt>action</dt><dd>${ay(a.action)}</dd></div>
        <div><dt>status</dt><dd>${ay(t.status)}</dd></div>
        <div><dt>lock</dt><dd>${ay(t.lock)}</dd></div>
      </dl>
      <ol class="capture-list">
        ${t.preconditions.map(e=>`
              <li>
                <strong>${ay(e.kind)}</strong>
                <em>${ay(e.owner)}</em>
                <span>${ay(e.message)}</span>
              </li>
            `).join("")}
      </ol>
    </section>
  `},ag=e=>`
  <section class="capture-preview capture-preview--patch">
    <div class="capture-section-heading">
      <span>Runtime patch preview</span>
      <strong>${ay(e.sourceFile)}</strong>
    </div>
    <p>${ay(e.note)}</p>
    <pre><code>${ay(e.patchPreview)}</code></pre>
  </section>
`,ap=e=>{let t=e.plan.target;return`
    <section class="capture-panel">
      <h3>Target</h3>
      <dl class="capture-kv">
        <div><dt>file</dt><dd>${ay(t.sourceFile??"runtime")}</dd></div>
        <div><dt>path</dt><dd>${ay(t.outlinePath.join(" / ")||t.kind)}</dd></div>
        <div><dt>date</dt><dd>${ay(af(t.date))}</dd></div>
        <div><dt>insert</dt><dd>${ay(t.insertPosition)}</dd></div>
      </dl>
    </section>
  `},am=e=>`
  <section class="capture-panel">
    <h3>Receipts</h3>
    <ol class="capture-list">
      ${e.plan.receipts.map(e=>`
            <li>
              <strong>${ay(e.kind)}</strong>
              <span>${ay(e.message)}</span>
            </li>
          `).join("")}
    </ol>
  </section>
`,ah=e=>0===e.plan.warnings.length?`
      <section class="capture-panel capture-panel--quiet">
        <h3>Warnings</h3>
        <p>No warnings.</p>
      </section>
    `:`
    <section class="capture-panel capture-panel--warning">
      <h3>Warnings</h3>
      <ol class="capture-list">
        ${e.plan.warnings.map(e=>`
              <li>
                <strong>${ay(e.kind)}</strong>
                <span>${ay(e.message)}</span>
              </li>
            `).join("")}
      </ol>
    </section>
  `,af=e=>e?`${e.year}-${av(e.month)}-${av(e.day)}`:"none",av=e=>String(e).padStart(2,"0"),ay=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");var a$=a(6893);let ab=e=>{if(!e.articleHtml||"u"<typeof DOMParser)return new Map;let t=new DOMParser().parseFromString(e.articleHtml,"text/html"),a=t.querySelector("main")??t.body,r=tf(e.document),n=new Set,l=new Map;for(let i of a.querySelectorAll("h1,h2,h3,h4,h5,h6")){let a=tv(i,r,n);if(!a)continue;n.add(a);let o=ak(i,t);tn(o,e.document,e.sourceFile),ts(o);let s=aC(o),d=aw(i,t);tn(d,e.document,e.sourceFile),ts(d),th(d,e.document),tj(d,e.document),d.querySelector("h1,h2,h3,h4,h5,h6")?.remove(),l.set(a.source.rangeStart,{bodyHtml:d.innerHTML.trim(),embedHtml:s,rangeStart:a.source.rangeStart,title:tE(a)})}return l},aw=(e,t)=>{let a=tN(e),r=t.createElement("div");r.append(e.cloneNode(!0));let n=e.nextElementSibling;for(;n&&!(aS(n)&&tN(n)<=a);)r.append(n.cloneNode(!0)),n=n.nextElementSibling;return r},ak=(e,t)=>{let a=t.createElement("div");a.append(e.cloneNode(!0));let r=e.nextElementSibling;for(;r&&!aS(r);)a.append(r.cloneNode(!0)),r=r.nextElementSibling;return a},aS=e=>/^H[1-6]$/.test(e.tagName),aC=e=>[...e.querySelectorAll(".videoWrapper, iframe, video, audio")].filter(e=>!ax(e)).map(e=>e.outerHTML).join(""),ax=e=>{let t=e.parentElement;for(;t;){if(t.classList.contains("videoWrapper")||"IFRAME"===t.tagName||"VIDEO"===t.tagName||"AUDIO"===t.tagName)return!0;t=t.parentElement}return!1},aA=e=>{let t=e.reduce((e,t)=>e+t.records.length,0);return 0===t?'<div class="empty">No Notes records found in the configured Org sources.</div>':`
    <section class="org-record-workbench" aria-label="Notes">
      <header class="org-record-header">
        <div>
          <p class="eyebrow">Org notes</p>
          <h2>Notes</h2>
          <p>${aB(aq(t,e.length))}</p>
        </div>
      </header>
      <div class="org-note-policy">
        <span>:record:</span>
        <span>:ATTACH:</span>
        <span>attachment-backed headings</span>
      </div>
      ${e.map(aL).join("")}
    </section>
  `},aE=e=>({rendered:aT(e),semantic:aR(e.document)}),aO=(e,t,a)=>e.rendered.get(t)?.title||aI(e,t)||aW(a),aT=e=>ab(e),aN=(e,t)=>{let a=t.rendered.get(e.rangeStart),r=a?.bodyHtml,n=t.semantic.get(e.rangeStart),l=r?"":`${aF(e)}${aM(e)}`;return`
    <article class="card org-record-card">
      <div class="card-kicker">${aB(aP(e,n))}</div>
      <h2>${aB(aD(e,t))}</h2>
      ${r?`<section class="org-record-render rendered-html">${r}</section>`:aj(e.rangeStart)}
      ${l}
    </article>
`},aL=e=>{let t=aE({articleHtml:e.html,document:e.document,sourceFile:e.sourceFile});return`
    <section class="org-record-source-group">
      <header>
        <div>
          <h3>${aB(e.name)}</h3>
          <p>${aB(e.file)} / ${e.records.length} notes</p>
        </div>
      </header>
      <div class="card-grid">
        ${e.records.map(e=>aN(e,t)).join("")}
      </div>
    </section>
  `},aR=e=>new Map(tf(e).map(e=>[e.source.rangeStart,e])),aj=e=>`
  <section class="org-record-render org-record-render--missing" data-range-start="${e}">
    <p>HTML projection missing for this Org section.</p>
  </section>
`,aI=(e,t)=>{let a=e.semantic.get(t);return a?tE(a):null},aD=(e,t)=>aO(t,e.rangeStart,e.title),aP=(e,t)=>{let a=t?.outlinePathText?.map(tT).filter(Boolean);return a&&a.length>0?a.join(" / "):aW(e.outline||e.title)},aM=e=>{let t=e.properties.slice(0,4);return 0===t.length?"":`<dl class="properties">${t.map(e=>`<div><dt>${aB(e.key)}</dt><dd>${aB(e.value)}</dd></div>`).join("")}</dl>`},aF=e=>eI(e.effectiveTags,{rowClassName:"meta-row"}),aq=(e,t)=>`${e} indexed notes from ${t} Org sources`,a_=e=>e.some(e=>aU(e,"record"))?"explicit :record:":e.some(e=>aU(e,"attach"))?"attachment-backed":"semantic",aU=(e,t)=>e.effectiveTags.some(e=>e.toLowerCase()===t),aW=e=>tT(e.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1")),aB=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),aV=/[./:?#[\]@!$&'()*+,;=%_-]/u,az=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},a=String(e);return a?aG(a,t.maxSegmentLength??24).map(aQ).join("<wbr>"):""},aG=(e,t)=>{let a=[],r="";for(let n of aH(e))r+=n,(aV.test(n)||r.length>=t)&&(a.push(r),r="");return r&&a.push(r),a.length>0?a:[e]},aH=e=>{let t=Intl.Segmenter;return t?Array.from(new t(void 0,{granularity:"grapheme"}).segment(e),e=>e.segment):Array.from(e)},aQ=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),aZ=(e,t)=>`
  <div>
    <dt>${rt(e)}</dt>
    <dd>${t}</dd>
  </div>
`,aK=(e,t)=>`
  <article class="memory-card memory-card--${e.decision.severity}">
    <header class="memory-card-topline">
      <span class="memory-code">${rt(e.decision.code)}</span>
      <span class="memory-severity">${rt(e.decision.severity)}</span>
      <a class="memory-source-link" href="#${(0,a$.qX)(e.source)}">${rt((0,a$.Ft)(e.source))}</a>
    </header>
    <div class="memory-card-body">
      <h4>${rt(aO(t,e.source.rangeStart,e.title))}</h4>
      <p>${rt(e.decision.title)}</p>
      ${re(e.todo,e.todoState,e.effectiveTags)}
    </div>
    <div class="memory-card-grid">
      ${a3(e.evidence)}
      ${a2(e.authority)}
      ${a4(e.links)}
    </div>
    <div class="memory-next"><span>next</span><p>${rt(e.decision.nextAction)}</p></div>
  </article>
`,aY=(e,t)=>0===e.records.length?"":`
    <details class="memory-record-group" ${"current"===e.state?"open":""}>
      <summary>
        <span>${rt(e.label)}</span>
        <strong>${e.records.length}</strong>
      </summary>
      <div class="memory-record-list">
        ${e.records.map(e=>aX(e,t)).join("")}
      </div>
    </details>
  `,aX=(e,t)=>{let a,r=(a=t.rendered.get(e.source.rangeStart),a?.bodyHtml?`
    <section class="org-record-render org-record-render--memory rendered-html" aria-label="Rendered Org memory">
      ${a.bodyHtml}
    </section>
  `:aj(e.source.rangeStart));return`
    <article class="memory-record" id="${(0,a$.qX)(e.source)}">
      <header>
        <div>
          <span>${rt((0,a$.b4)(e.state))}</span>
          <h4>${rt(aO(t,e.source.rangeStart,e.title))}</h4>
        </div>
        <code>${rt((0,a$.Ft)(e.source))}</code>
      </header>
      ${re(e.todo,e.todoState,e.effectiveTags)}
      ${r??""}
      <div class="memory-record-details">
        ${a6(e.properties)}
        ${a9(e.evidence)}
        ${a8(e.links)}
      </div>
    </article>
  `},aJ=(e,t,a)=>{let r=a>0?Math.max(4,Math.round(t/a*100)):0;return`
    <div>
      <dt>${rt(e)}</dt>
      <dd><span style="--memory-bar:${r}%"></span><strong>${t}</strong></dd>
    </div>
  `},a0=(e,t)=>`
  <section class="memory-inspector-section">
    <p class="eyebrow">${rt(e)}</p>
    ${t.length>0?`<ul class="memory-facets">${t.map(a1).join("")}</ul>`:`<p>No ${e.toLowerCase()} facets.</p>`}
  </section>
`,a1=e=>`
  <li>
    <span style="--memory-bar:${Math.max(4,Math.round(100*e.weight))}%"></span>
    <strong>${rt(e.label)}</strong>
    <em>${e.count}</em>
  </li>
`,a3=e=>`
  <section>
    <h5>Evidence</h5>
    ${e.length>0?`<div class="memory-chip-list">${e.slice(0,8).map(a5).join("")}</div>`:"<p>None</p>"}
  </section>
`,a2=e=>`
  <section>
    <h5>Authority</h5>
    ${e.length>0?`<ul>${e.map(e=>`<li>${rt(e.label)}</li>`).join("")}</ul>`:"<p>None</p>"}
  </section>
`,a4=e=>`
  <section>
    <h5>Links</h5>
    ${e.length>0?`<ul>${e.slice(0,4).map(a7).join("")}</ul>`:"<p>None</p>"}
  </section>
`,a6=e=>`
  <details ${e.length>0?"open":""}>
    <summary>Properties <span>${e.length}</span></summary>
    ${e.length>0?`<dl>${e.map(e=>`<div><dt>${rt(e.key)}</dt><dd>${rt(e.value)}</dd></div>`).join("")}</dl>`:"<p>None</p>"}
  </details>
`,a9=e=>`
  <details open>
    <summary>Evidence <span>${e.length}</span></summary>
    ${e.length>0?`<ul>${e.map(e=>`<li><strong>${rt(e.kind.label)}</strong><span>${rt(e.value)}</span></li>`).join("")}</ul>`:"<p>None</p>"}
  </details>
`,a8=e=>`
  <details ${e.length>0?"open":""}>
    <summary>Links <span>${e.length}</span></summary>
    ${e.length>0?`<ul>${e.map(a7).join("")}</ul>`:"<p>None</p>"}
  </details>
`,a5=e=>`<span title="${ra(e.value)}">${rt(e.kind.label)}</span>`,a7=e=>`<li class="memory-link-item"><code>${az(e.path)}</code><span>${az(e.description)}</span></li>`,re=(e,t,a)=>eR([eL(e,t),...ej(a)],{rowClassName:"org-meta-row--tags memory-tags"}),rt=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),ra=e=>rt(e),rr=function(e){let t=!(arguments.length>1)||void 0===arguments[1]||arguments[1];return rl(e.flatMap(rn),e.length,t)},rn=e=>{let{document:t,embedHtmlByRangeStart:a,records:r,sourceFile:n,sourceName:l}=e,i=r??(t?tf(t):[]);if(0===i.length)return[];let o=i.filter(rd),s=null,d=[];for(let e of o){let t=tE(e);if(!t)continue;let r=ru(t);r&&(s=r),d.push(ri(e,s,{embedHtmlByRangeStart:a,sourceFile:n,sourceName:l}))}return d},rl=(e,t,a)=>{let r=[...new Set(e.map(e=>e.region).filter(rO))],n=new Set(e.map(e=>e.sourceFile??e.sourceName??"current")).size;return{places:e,regions:r,scannedSourceCount:t,sourceCount:e.length>0?n:0,locatedCount:e.filter(e=>e.coordinates).length,enrichCandidateCount:e.filter(e=>e.needsEnrichment).length,siteWide:a}},ri=(e,t,a)=>{var r;let n,l,i=tE(e),o=ru(i),s=[...new Set(e.effectiveTags.filter(Boolean))],d=rc(e)??t,c=rm(e),u=rA(e,"GOOGLE_PLACE_ID")??rA(e,"PLACE_ID"),g=rv(e),p=rp(rA(e,"GOOGLE_MAPS_QUERY")??rA(e,"MAPS_QUERY")??rA(e,"LOCATION_QUERY"),c,o?[]:g,o??i,d),m=rk(e,c,g),h=rx(e,c,d,u);return{id:ro(a.sourceFile,e.source.rangeStart),rangeStart:e.source.rangeStart,title:i,outline:rE(e),sourceFile:a.sourceFile??null,sourceName:a.sourceName??null,region:d,tags:s,kind:rg(!!o),coordinates:c,query:p,googleMapsUrl:(r=u??void 0,(n=new URL("https://www.google.com/maps/search/")).searchParams.set("api","1"),n.searchParams.set("query",p),r&&n.searchParams.set("query_place_id",r),rs(n.toString())),googleMapsEmbedUrl:((l=new URL("https://maps.google.com/maps")).searchParams.set("q",p),l.searchParams.set("output","embed"),rs(l.toString())),sourceLinks:r$(e),embedHtml:a.embedHtmlByRangeStart?.get(e.source.rangeStart)??"",evidence:m,enrichFields:h,needsEnrichment:h.length>0}},ro=(e,t)=>{let a=e?.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"current";return`${a}-${t}`},rs=e=>e,rd=e=>!!(e.effectiveTags.some(e=>"travel"===e.toLowerCase())||ru(tE(e))||rc(e))||!!(rm(e)||rA(e,"GOOGLE_MAPS_QUERY")),rc=e=>{for(let t of e.outlinePathText??e.outlinePath??[]){let e=ru(t);if(e)return e}return null},ru=e=>{let t=/^游山玩水->(.+)$/.exec(tT(e));return t?t[1].trim():null},rg=e=>e?"region":"place",rp=(e,t,a,r,n)=>{if(e)return e;if(t)return`${t.lat},${t.lon}`;let l=a[0]??r;return n&&!l.includes(n)?`${l} ${n}`:l},rm=e=>{let t=rA(e,"GEO_LAT")??rA(e,"LATITUDE"),a=rA(e,"GEO_LON")??rA(e,"LONGITUDE");if(t&&a)return rf(Number(t),Number(a),`${t},${a}`);let r=rA(e,"地理坐标")??rA(e,"COORDINATES")??rA(e,"GEO")??rA(e,"LOCATION");return r?rh(r):null},rh=e=>{let t=/(-?\d{1,3}(?:\.\d+)?)\s*[;,]\s*(-?\d{1,3}(?:\.\d+)?)/.exec(e);if(t)return rf(Number(t[1]),Number(t[2]),e);let a=/(-?\d{1,3}(?:\.\d+)?)\s*°?\s*[NS北南]?\s+(-?\d{1,3}(?:\.\d+)?)\s*°?\s*[EW东西]?/.exec(e);return a?rf(Number(a[1]),Number(a[2]),e):null},rf=(e,t,a)=>Number.isFinite(e)&&Number.isFinite(t)&&90>=Math.abs(e)&&180>=Math.abs(t)?{lat:e,lon:t,raw:a}:null,rv=e=>[...new Set(rw(e).filter(e=>e.path.startsWith("id:")).map(e=>tT(e.description)).filter(ry))],ry=e=>!(0===e.length||e.startsWith("id:"))&&!/youtube|youtu\.be|视频|日记|合集|播放|episode|vlog/i.test(e),r$=e=>[...new Map(rw(e).filter(e=>/^https?:\/\//.test(e.path)).map(e=>[e.path,{kind:rb(e.path),label:tT(e.description||e.path),url:e.path}])).values()],rb=e=>/youtube\.com|youtu\.be/.test(e)?"video":/wikipedia\.org|baike\.baidu\.com/.test(e)?"wiki":"web",rw=e=>e.links.map(e=>({path:e.path??"",description:e.description??e.path??""})).filter(e=>e.path.length>0),rk=(e,t,a)=>{let r=[];for(let e of(t&&r.push({label:"coordinates",value:`${t.lat}, ${t.lon}`}),a.slice(0,3)))r.push({label:"place hint",value:e});for(let t of e.properties.filter(rS).slice(0,4))r.push({label:t.key,value:t.value});for(let t of rC(e).slice(0,2))r.push({label:"captured",value:t});return r},rS=e=>["地理坐标","URL","wikinfo-id","GOOGLE_MAPS_QUERY","GOOGLE_PLACE_ID","GEO_LAT","GEO_LON","TRAVEL_REGION"].includes(e.key),rC=e=>[...new Set(e.body.flatMap(e=>[...e.text.matchAll(/\[(\d{4}-\d{2}-\d{2}[^\]]*)\]/g)].map(e=>e[1])))],rx=(e,t,a,r)=>{let n=[];return t||n.push("GEO_LAT","GEO_LON"),rA(e,"GOOGLE_MAPS_QUERY")||n.push("GOOGLE_MAPS_QUERY"),r||n.push("GOOGLE_PLACE_ID"),a&&!rA(e,"TRAVEL_REGION")&&n.push("TRAVEL_REGION"),n},rA=(e,t)=>e.properties.find(e=>e.key.toUpperCase()===t.toUpperCase())?.value??null,rE=e=>(e.outlinePathText??e.outlinePath??[tE(e)]).map(tT).filter(Boolean).join(" / "),rO=e=>"string"==typeof e,rT=function(e,t,a){let r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"",n=a??rr([{document:e,embedHtmlByRangeStart:e&&r?new Map([...ab({articleHtml:r,document:e,sourceFile:t})].filter(e=>{let[,t]=e;return t.embedHtml.length>0}).map(e=>{let[t,a]=e;return[t,a.embedHtml]})):void 0,sourceFile:t}],!1);return 0===n.places.length?`<div class="empty">${n.siteWide?"No travel places in indexed Org sources.":"No travel places in this Org source."}</div>`:`
    <section class="travel-workbench" aria-label="Travel">
      <header class="travel-header">
        <div>
          <p class="eyebrow">Org travel</p>
          <h2>Travel</h2>
          <p>${rW(rq(n))}</p>
        </div>
        <dl class="travel-metrics">
          <div><dt>Places</dt><dd>${n.places.length}</dd></div>
          <div><dt>Sources</dt><dd>${n.sourceCount}</dd></div>
          <div><dt>Located</dt><dd>${n.locatedCount}</dd></div>
          <div><dt>Enrich</dt><dd>${n.enrichCandidateCount}</dd></div>
        </dl>
      </header>
      <div class="travel-layout">
        <div class="travel-card-grid"${n.places.length>=80?" data-travel-virtual-list":""}>
          ${n.places.map(rN).join("")}
        </div>
      </div>
    </section>
  `},rN=e=>{let t=`travel-map-${e.id}`;return`
  <article class="travel-place-card travel-place-card--${rB(e.kind)}" data-travel-card data-travel-title="${rB(e.title)}" role="button" tabindex="0" aria-label="${rB(`Preview ${e.title}`)}">
    <div class="travel-card-head">
      <div class="travel-card-kicker">
        <span>${rW(r_(e.kind))}</span>
        ${e.region?`<b>${rW(e.region)}</b>`:""}
      </div>
      <h3>${rW(e.title)}</h3>
      <p>${rW(e.outline)}</p>
    </div>
    ${rj(e)}
    <dl class="travel-place-facts travel-place-facts--compact">
      <div><dt>Query</dt><dd>${rW(e.query)}</dd></div>
      ${e.coordinates?`<div><dt>Coordinates</dt><dd>${rW(`${e.coordinates.lat}, ${e.coordinates.lon}`)}</dd></div>`:""}
    </dl>
    <div class="travel-card-status">
      <span>${e.coordinates?"Located":"Needs geo"}</span>
      <span>${e.sourceLinks.length} sources</span>
      <span>${e.enrichFields.length} enrich</span>
    </div>
    <div class="travel-card-actions">
      <button type="button" class="travel-map-toggle" data-travel-map-toggle aria-expanded="false" aria-controls="${t}">Map preview</button>
    </div>
    ${rL(e,t)}
    ${rR(e)}
  </article>
`},rL=function(e,t){let a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"",r=!(arguments.length>3)||void 0===arguments[3]||arguments[3];return`
  <div id="${rB(t)}" class="travel-inline-map ${rB(a)}" data-travel-map${r?" hidden":""}>
    <iframe
      title="${rB(`Google Maps preview for ${e.title}`)}"
      data-map-src="${rB(e.googleMapsEmbedUrl)}"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    ></iframe>
  </div>
`},rR=e=>`
  <template data-travel-glance-template>
    <article class="travel-glance-article">
      <header>
        <span>${rW(r_(e.kind))}</span>
        <h3>${rW(e.title)}</h3>
        <p>${rW(e.outline)}</p>
      </header>
      <div class="travel-glance-flow" data-travel-glance-flow data-layout="pending" aria-busy="true">
        <span class="travel-glance-sizer" aria-hidden="true"></span>
        ${rP(e)}
        ${rM(e)}
        ${rL(e,`travel-glance-map-${e.id}`,"travel-inline-map--glance travel-glance-flow-item travel-glance-flow-item--full travel-glance-flow-item--map",!1)}
        ${rI(e.evidence)}
        ${rD(e)}
        ${rF(e)}
      </div>
    </article>
  </template>
`,rj=e=>eI(e.tags.slice(0,8),{rowClassName:"travel-tags"}),rI=e=>e.length>0?`<dl class="travel-evidence travel-glance-flow-item">${e.map(e=>`
            <div>
              <dt>${rW(e.label)}</dt>
              <dd>${rW(e.value)}</dd>
            </div>
          `).join("")}</dl>`:"",rD=e=>e.sourceLinks.length>0?`<div class="travel-source-links travel-glance-flow-item">${e.sourceLinks.slice(0,4).map(e=>`<a href="${rB(e.url)}" target="_blank" rel="noreferrer">${rW(rU(e.kind))}: ${rW(e.label)}</a>`).join("")}</div>`:"",rP=e=>`
  <dl class="travel-glance-facts travel-glance-flow-item travel-glance-flow-item--full">
    <div><dt>Map query</dt><dd>${rW(e.query)}</dd></div>
    ${e.sourceName||e.sourceFile?`<div><dt>Source</dt><dd>${rW(e.sourceName??e.sourceFile??"")}</dd></div>`:""}
    ${e.region?`<div><dt>Region</dt><dd>${rW(e.region)}</dd></div>`:""}
    ${e.coordinates?`<div><dt>Coordinates</dt><dd>${rW(`${e.coordinates.lat}, ${e.coordinates.lon}`)}</dd></div>`:""}
  </dl>
`,rM=e=>e.embedHtml?`<section class="travel-media-flow travel-glance-flow-item travel-glance-flow-item--full rendered-html" aria-label="Embedded travel media">${e.embedHtml}</section>`:"",rF=e=>e.enrichFields.length>0?`<div class="travel-enrich travel-glance-flow-item">
        <span>Enrich contract</span>
        ${e.enrichFields.map(e=>`<code>${rW(e)}</code>`).join("")}
      </div>`:"",rq=e=>e.siteWide?`${e.places.length} Org headings projected from ${e.sourceCount} source files across ${e.regions.length} regions.`:`${e.places.length} Org headings projected into travel places across ${e.regions.length} regions.`,r_=e=>{switch(e){case"region":return"Region";case"place":return"Place"}},rU=e=>{switch(e){case"video":return"Video";case"wiki":return"Wiki";case"web":return"Link"}},rW=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),rB=rW,rV=e=>{let t=rz(e);if(null!==t)return t;let a=e.pendingMessage??"";return a?`<div class="empty">${rQ(a)}</div>`:e.document?rG({...e,document:e.document}):""},rz=e=>"blog"===e.view&&e.blogIndex&&!e.blogZenMode?tQ({document:e.document,articleHtml:e.articleHtml??"",articleMessage:e.articleMessage??"",blogIndex:e.blogIndex,selectedRangeStart:e.blogArticleRangeStart??null,tagFilter:e.blogTagFilter??null,timeFilter:e.blogTimeFilter??null,zenMode:!1,sourceFile:e.sourceFile}):"travel"===e.view&&e.travelView?rT(e.document,e.sourceFile,e.travelView,e.articleHtml):"gallery"===e.view&&void 0!==e.attachmentGallery?e6(e.attachmentGallery??null):"records"===e.view&&void 0!==e.siteNotes?e.siteNotes?aA(e.siteNotes):'<div class="empty">Loading static notes...</div>':null,rG=e=>{let{view:t,document:a,agendaMode:r="classic",agendaPanel:n="trace",agendaRuleId:l=null,articleHtml:i="",articleMessage:o="",blogArticleRangeStart:s=null,blogIndex:d,blogTagFilter:c=null,blogTimeFilter:u=null,blogZenMode:p=!1,attachmentGallery:m,siteNotes:h,travelView:f,sourceFile:v}=e;switch(t){case"blog":return tQ({document:a,articleHtml:i,articleMessage:o,blogIndex:d,selectedRangeStart:s,tagFilter:c,timeFilter:u,zenMode:p,sourceFile:v});case"gallery":let y;return e6(m??(y=a.attachmentInventory,{records:y?.display.filter(eK).map(e=>({record:e,sourceFile:v,sourceId:v??"current",sourceName:eZ(v)}))??[],entryCount:y?.entries.length??0,sourceCount:1,label:eZ(v),siteWide:!1}));case"records":if(h)return aA(h);return((e,t,a)=>{var r,n;let l,i;if(0===e.length)return`<div class="empty">No ${t.toLowerCase()} records found.</div>`;let o=aE(a);return`
    <section class="org-record-workbench" aria-label="${aB(t)}">
      <header class="org-record-header">
        <div>
          <p class="eyebrow">Org notes</p>
          <h2>${aB(t)}</h2>
          <p>${aB((r=e,n=a.sourceFile,l=1===r.length?"heading":"headings",i=n?n.split("/").filter(Boolean).pop():null,`${r.length} ${a_(r)} ${l} from ${i??"Org source"}`))}</p>
        </div>
      </header>
      <div class="card-grid">${e.map(e=>aN(e,o)).join("")}</div>
    </section>
  `})((0,g.dc)(a),"Notes",{articleHtml:i,document:a,sourceFile:v});case"memory":return((e,t)=>{let a,r,n,l;if(!e)return'<div class="empty">Loading memory projection...</div>';if(0===e.response.stats.totalRecords)return`
      <section class="memory-workbench">
        <header class="memory-header">
          <div>
            <p class="eyebrow">Org memory</p>
            <h2>No memory records in this source</h2>
            <p>Headings, properties, planning timestamps, links, drawers, and lifecycle evidence will appear here when present.</p>
          </div>
        </header>
      </section>
    `;let i=aE(t);return`
    <section class="memory-workbench" aria-label="Org memory">
      <header class="memory-header">
        <div>
          <p class="eyebrow">Org memory</p>
          <h2>Agent memory graph</h2>
          <p>Orgize projection of records, cards, source evidence, authority rules, links, and historical state.</p>
        </div>
        ${a=e.response.stats,`
  <dl class="memory-metrics" aria-label="Memory metrics">
    ${aZ("records",a.totalRecords)}
    ${aZ("current",a.currentRecords)}
    ${aZ("background",a.backgroundRecords)}
    ${aZ("history",a.closedRecords+a.archivedRecords)}
    ${aZ("evidence",a.evidence)}
    ${aZ("authority",a.authorityReasons)}
  </dl>
`}
      </header>
      <div class="memory-layout">
        <main class="memory-stream" aria-label="Memory cards and records">
          ${e.groups.map(e=>{let t,a;return t=e,a=i,0===t.cards.length?"":`
    <section class="memory-lane memory-lane--${t.state}" aria-label="${ra(t.label)} memory">
      <header class="memory-lane-header">
        <div>
          <span>${rt(t.label)}</span>
          <h3>${t.cards.length} cards</h3>
        </div>
        <p>${rt(t.summary)}</p>
      </header>
      <div class="memory-card-list">
        ${t.cards.map(e=>aK(e,a)).join("")}
      </div>
    </section>
  `}).join("")}
          ${r=e.groups,n=i,`
  <section class="memory-record-index" aria-label="Memory record index">
    <header class="memory-section-heading">
      <p class="eyebrow">Record index</p>
      <h3>Source-backed memory records</h3>
    </header>
    ${r.map(e=>aY(e,n)).join("")}
  </section>
`}
        </main>
        <aside class="memory-inspector" aria-label="Memory facets">
          ${l=e.response.stats,`
  <section class="memory-inspector-section">
    <p class="eyebrow">State matrix</p>
    <dl class="memory-state-matrix">
      ${aJ("Current",l.currentRecords,l.totalRecords)}
      ${aJ("Background",l.backgroundRecords,l.totalRecords)}
      ${aJ("Closed",l.closedRecords,l.totalRecords)}
      ${aJ("Archived",l.archivedRecords,l.totalRecords)}
    </dl>
  </section>
`}
          ${a0("Evidence",e.topEvidence)}
          ${a0("Authority",e.topAuthority)}
        </aside>
      </div>
    </section>
  `})(a.agentMemory,{articleHtml:i,document:a,sourceFile:v});case"travel":return rT(a,v,f,i);case"agenda":return((e,t,a,r)=>{let n,l,i,o,s=((e,t)=>{var a,r,n;let l,i,o,s,d,c,u,g,p,m,h,f,v,y,b,w,k,S,C,x,A,E,O,T;if(!e?.agendaView||!e.agendaRange)return null;let N=F[t]??F.classic,L=e.agendaView.cards.map(t=>{var a;let r,n;return a=t,r=e.recordsByRangeStart.get(a.source.rangeStart)??null,{...n={...a,title:e$(a.title),blockers:a.blockers.map(e=>({...e,blocker:{...e.blocker,title:e$(e.blocker.title)}}))},record:r,signals:ec(n,r),planning:es(r),pressure:eg(n),agentState:ep(n,r),memorySignals:eu(n,r)}}),R=((e,t)=>{let a=[...e],r=[],n=[],l=0,i=0;for(let e of t.rules){let t=e.selector,o=a.length,s=$(t);if("discard"===t.kind){let r=a.filter(e=>G(e,t.selector)),d=new Set(r);a=a.filter(e=>!d.has(e)),l+=r.length,i+=r.length,n.push(B(e,s,"discard",{beforeCount:o,matchedCount:r.length,emittedCount:0,consumedCount:r.length,discardedCount:r.length,remainingAfter:a.length,outputTitles:[],note:r.length>0?"Matched rows are consumed without creating a section.":"No rows matched; downstream input is unchanged."}));continue}if("take"===t.kind){let d=a.filter(e=>G(e,t.selector)),c=d.slice(0,t.count),u=new Set(d);a=a.filter(e=>!u.has(e));let g=Math.max(0,d.length-c.length);l+=g,i+=d.length,c.length>0&&r.push(V(e,c,null)),n.push(B(e,s,"take",{beforeCount:o,matchedCount:d.length,emittedCount:c.length,consumedCount:d.length,discardedCount:g,remainingAfter:a.length,outputTitles:c.map(e=>e.title),note:d.length>0?`First ${t.count} matches are emitted; later matches are hidden from downstream rules.`:"No rows matched the bounded selector."}));continue}if("auto"===t.kind){let l=new Map,d=[];for(let e of a){let a=K(e,t);a&&(d.push(e),l.set(a,[...l.get(a)??[],e]))}let c=new Set(d);a=a.filter(e=>!c.has(e)),i+=d.length;let u=[...l.entries()].sort((e,t)=>{let[a]=e,[r]=t;return a.localeCompare(r)}).map(t=>{let[a,r]=t;return V(e,r,a)});r.push(...u),n.push(B(e,s,"auto",{beforeCount:o,matchedCount:d.length,emittedCount:d.length,consumedCount:d.length,discardedCount:0,remainingAfter:a.length,outputTitles:u.map(e=>e.title),note:u.length>0?`${u.length} generated section${1===u.length?"":"s"} from parser metadata.`:"No parser metadata buckets were generated."}));continue}let d=a.filter(e=>G(e,t)),c=new Set(d);a=a.filter(e=>!c.has(e)),i+=d.length,d.length>0&&r.push(V(e,d,null)),n.push(B(e,s,"group",{beforeCount:o,matchedCount:d.length,emittedCount:d.length,consumedCount:d.length,discardedCount:0,remainingAfter:a.length,outputTitles:d.length>0?[e.title]:[],note:d.length>0?"Matched rows become a visible section and are removed from downstream selectors.":"No rows matched; downstream input is unchanged."}))}return a.length>0&&r.push({id:"unmatched",ruleId:"unmatched",title:"Other items",subtitle:"Rows that did not match any configured group, displayed at order 99.",selector:":anything",order:99,tone:"muted",autoKey:null,cards:a}),{groups:r.filter(e=>e.cards.length>0).sort((e,t)=>e.order-t.order||e.title.localeCompare(t.title)),trace:n,discardedCount:l,unmatchedCount:a.length,consumedCount:i}})(L,N),j=L.filter(e=>e.blockers.length>0).length,I=L.filter(e=>!!e.time).length,D=L.filter(e=>"deadline"===e.kind).length,P=L.reduce((e,t)=>e+t.receipts.length,0),M=L.filter(e=>e.memorySignals.length>0).length,_=L.reduce((e,t)=>e+(t.record?.properties.length??0),0),W=(l=(e=>{let t=new Set;for(let a of e.rules)U(a.selector,t),a.face&&t.add("face"),a.orderMulti&&t.add("order-multi"),a.transformer&&t.add("transformer");return t})(N),q.map(e=>({...e,active:"order"===e.id?N.rules.some(e=>0!==e.order):l.has(e.id)}))),z={total:(i=W).length,implemented:i.filter(e=>"planned"!==e.status).length,active:i.filter(e=>e.active).length,planned:i.filter(e=>"planned"===e.status).length};return{mode:t,program:N,rangeLabel:e.agendaRange.label,totalCandidates:e.agendaView.totalCandidates,visibleCount:L.length,skippedCount:e.agendaView.skipped.length,limit:e.agendaView.limit??null,consumedCount:R.consumedCount,discardedCount:R.discardedCount,unmatchedCount:R.unmatchedCount,insights:(o=L,s=D,d=I,c=j,u=P,g=R,p=e,[`${o.length} visible`,`${g.consumedCount} consumed`,`${g.discardedCount} discarded`,`${g.unmatchedCount} unmatched`,`${s} deadlines`,`${d} timed`,`${c} blocked`,`${u} receipts`,p.agendaView?.skipped.length?`${p.agendaView.skipped.length} skipped by limit`:"no limit skips"]),metrics:(m=L,h=R,f=z,v=j,y=D,b=P,w=_,k=M,S=e,[{label:"Input rows",value:String(m.length),detail:`${S.agendaView?.totalCandidates??m.length} parsed candidates`,tone:"steady"},{label:"Sections",value:String(h.groups.length),detail:`${h.consumedCount} consumed / ${h.unmatchedCount} unmatched`,tone:"focus"},{label:"Risk edges",value:String(v+y),detail:`${v} blocked / ${y} deadline`,tone:v>0?"critical":y>0?"deadline":"steady"},{label:"Selectors",value:`${f.implemented}/${f.total}`,detail:`${f.active} active / ${f.planned} planned`,tone:"steady"},{label:"Agent context",value:String(b+w+k),detail:`${b} receipts / ${w} properties / ${k} memory`,tone:"waiting"}]),capabilitySummary:z,selectorCapabilities:W,trace:R.trace,agentBrief:(a=L,r=R.groups,n={blockedCount:j,deadlineCount:D,timedCount:I,receiptCount:P,memoryCount:M},C=a.find(e=>e.blockers.length>0),x=a.find(e=>"deadline"===e.kind),A=a.find(e=>!!e.time),E=a.find(e=>e.memorySignals.length>0),O=[C?`Explain the blocker chain for "${C.title}".`:null,x?`Generate a deadline-risk note for "${x.title}".`:null,A?`Turn "${A.title}" into the next execution brief.`:null,E?`Promote "${E.title}" into the running agenda record.`:null].filter(e=>!!e),{headline:em(C,x,A),summary:`${r.length} visible sections / ${a.length} agenda rows / ${n.receiptCount} parser receipts / ${n.memoryCount} memory-linked rows / ${n.blockedCount} blockers / ${n.deadlineCount} deadlines / ${n.timedCount} timed slots`,recommendations:O.length>0?O:["Summarize the visible agenda into a daily operating note."],prompts:["Explain this agenda by selector rule, using receipts and blockers as evidence.","Draft a progress log from DONE, record, and memory rows.","Turn deadline pressure into a concrete next-action queue."],captureLog:eh(a)}),sortSteps:(T=e.agendaView).sortStrategy.length>0?T.sortStrategy.map(ef):(T.cards[0]?.sortKeys??[]).map(e=>({label:ev(e.key),direction:"default",detail:ey(e.key)})),groups:R.groups,skipped:e.agendaView.skipped}})(e,t);if(!s)return'<div class="empty">Loading WASM agenda projection...</div>';if(0===s.totalCandidates)return`<div class="empty">No WASM agenda rows in ${eQ(s.rangeLabel)}.</div>`;let d=(n=s,(l=r)&&n.trace.some(e=>e.ruleId===l)?l:n.trace.find(e=>e.emittedCount>0)?.ruleId??n.trace[0]?.ruleId??null);return`
    <section class="super-agenda agenda-workbench">
      <header class="agenda-program-header">
        <div class="agenda-program-copy">
          <p class="eyebrow">Org Super Agenda workbench</p>
          <h2>${eQ(s.program.label)}</h2>
          <p>${eQ(s.program.intent)}</p>
          <div class="agenda-program-badges">
            <span>selector DSL</span>
            <span>consume pipeline</span>
            <span>auto groups</span>
            <span>agent handoff</span>
          </div>
        </div>
        <dl class="agenda-metrics agenda-metrics--program">
          ${s.metrics.map(eP).join("")}
        </dl>
      </header>
      ${i=s.mode,`
  <div class="agenda-program-switcher" role="group" aria-label="Super agenda program">
    ${Object.values(F).map(e=>`
          <button
            type="button"
            data-agenda-mode="${eQ(e.key)}"
            class="${e.key===i?"active":""}"
          >
            <strong>${eQ(e.shortLabel)}</strong>
            <span>${eQ(e.description)}</span>
          </button>
        `).join("")}
  </div>
`}
      <div class="agenda-insights agenda-insights--dense">
        <strong>${eQ(s.rangeLabel)}</strong>
        ${s.insights.map(e=>`<span>${eQ(e)}</span>`).join("")}
      </div>
      <div class="agenda-program-layout">
        <aside class="agenda-inspector">
          
  <div class="agenda-panel-tabs agenda-panel-tabs--wide" role="tablist" aria-label="Agenda inspector">
    ${eb("trace","Trace",a)}
    ${eb("selectors","Selectors",a)}
    ${eb("source","Program",a)}
    ${eb("agent","Agent",a)}
    ${eb("records","Records",a)}
  </div>
  ${((e,t,a)=>{switch(t){case"trace":return ew(e,a);case"selectors":return eS(e);case"source":return eA(e);case"agent":return eE(e);case"records":return eO(e)}})(s,a,d)}

        </aside>
        <main class="agenda-output" aria-label="Compiled agenda sections">
          <div class="agenda-section-heading agenda-section-heading--large">
            <span>Compiled sections</span>
            <strong>${s.groups.length} sections / ${s.consumedCount} consumed</strong>
          </div>
          ${((e,t)=>{let a=e.trace.find(e=>e.ruleId===t);if(!a)return"";let r=e.groups.filter(e=>e.ruleId===a.ruleId),n=r.length>0?r.map(e=>e.title).join(" / "):a.outputTitles.join(" / ")||"no visible section";return`
    <section class="agenda-rule-microscope agenda-rule-microscope--${a.tone}">
      <div>
        <span>Rule microscope</span>
        <strong>${eQ(a.title)}</strong>
        <code>${eQ(a.selector)}</code>
      </div>
      <dl>
        <div><dt>operation</dt><dd>${eQ(a.operation)}</dd></div>
        <div><dt>matched</dt><dd>${a.matchedCount}</dd></div>
        <div><dt>emitted</dt><dd>${a.emittedCount}</dd></div>
        <div><dt>remain</dt><dd>${a.remainingAfter}</dd></div>
      </dl>
      <p>${eQ(n)}</p>
    </section>
  `})(s,d)}
          <div class="agenda-groups">
            ${s.groups.map(e=>{let t,a;return t=e,a=d,`
  <details
    class="agenda-group agenda-group--${t.tone} ${t.ruleId===a?"agenda-group--selected":""}"
    data-agenda-group-rule="${eQ(t.ruleId)}"
    open
  >
    <summary data-agenda-rule-select="${eQ(t.ruleId)}">
      <span class="agenda-group-title">
        <span class="agenda-group-line">
          <code>${eQ(t.selector)}</code>
          <em>order ${t.order}</em>
          ${t.face?`<em>face ${eQ(t.face)}</em>`:""}
          ${t.transformer?`<em>transform ${eQ(t.transformer)}</em>`:""}
        </span>
        <strong>${eQ(t.title)}</strong>
        <small>${eQ(t.subtitle)}</small>
      </span>
      <span class="agenda-group-count">
        <b>${t.cards.length}</b>
        <small>rows</small>
      </span>
    </summary>
    ${eM(t)}
    <div class="agenda-row-stack">
      ${t.cards.map(e=>eq(e,t.transformer)).join("")}
    </div>
  </details>
`}).join("")}
          </div>
          ${0===(o=s).skipped.length?"":`
    <details class="agenda-skipped">
      <summary>${o.skippedCount} skipped candidates</summary>
      <ol>
        ${o.skipped.map(eG).join("")}
      </ol>
    </details>
  `}
        </main>
      </div>
    </section>
  `})(a,r,n,l);case"capture":var b,w,k;let S;return a.capturePlan&&a.captureRequest&&a.captureApplyPreview?(b=a.capturePlan,w=a.captureRequest,k=a.captureApplyPreview,S=b.plan,`
    <section class="capture-workbench">
      <header class="capture-header">
        <div>
          <p class="eyebrow">Agent Capture projection</p>
          <h2>${ay(w.title)}</h2>
          <p>${ay(w.body??"")}</p>
        </div>
        <dl class="capture-metrics">
          <div><dt>target</dt><dd>${ay(S.target.kind)}</dd></div>
          <div><dt>memory</dt><dd>${ay(w.memoryPolicy??"none")}</dd></div>
          <div><dt>warnings</dt><dd>${S.warnings.length}</dd></div>
        </dl>
      </header>
      <div class="capture-layout">
        <div class="capture-main">
          <section class="capture-preview">
            <div class="capture-section-heading">
              <span>Native Org entry</span>
              <strong>${S.requiresConfirmation?"confirmation required":"ready"}</strong>
            </div>
            <pre><code>${ay(S.orgEntry)}</code></pre>
          </section>
          ${ag(k)}
        </div>
        <aside class="capture-inspector">
          ${au(b,k)}
          ${ap(b)}
          ${am(b)}
          ${ah(b)}
        </aside>
      </div>
    </section>
  `):'<div class="empty">Loading Agent capture projection...</div>';case"diagnostics":return a.lint?rH(a.lint):'<div class="empty">Loading lint...</div>'}},rH=e=>0===e.length?'<div class="empty">No lint findings.</div>':`<ol class="diagnostics">${e.map(e=>`
        <li>
          <strong>${rQ(e.code)}</strong>
          <span>${rQ(e.severity)}</span>
          <p>${rQ(e.message)}</p>
        </li>
      `).join("")}</ol>`,rQ=e=>String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");var rZ=a(290);let rK=new WeakMap;function rY(){let e=document.querySelector("#view");if(!e)throw Error("missing #view root");return{view:e}}let rX=null,rJ=()=>rX??=Promise.all([a.e(10),a.e(404)]).then(a.bind(a,2655)).then(e=>{let{QueryClient:t}=e;return new t({defaultOptions:{queries:{gcTime:1/0,retry:!1,staleTime:1/0}}})});var r0=a(8443);function r1(e){let{children:t,readerMode:a,shell:n}=e;return(0,r.jsxs)("main",{className:`shell${"zen"===a?" shell--zen":""}`,children:["library"===a?(0,r.jsx)(r3,{shell:n}):null,"library"===a?(0,r.jsx)(r2,{title:n.siteConfig.title}):null,(0,r.jsx)("section",{className:"viewer-pane",children:t}),"library"===a?(0,r.jsx)(r4,{shell:n}):null]})}function r3(e){let{shell:t}=e;return(0,r.jsxs)("header",{className:"site-header",children:[(0,r.jsxs)(r0.N_,{className:"site-brand",to:"/blogs","aria-label":"Zhixing home",children:[(0,r.jsx)("span",{children:"知行合一"}),(0,r.jsx)("small",{children:"Zhixing"})]}),(0,r.jsx)("nav",{id:"tabs",className:"site-nav","aria-label":"Life archive navigation",children:t.siteConfig.menu.map(e=>(0,r.jsxs)(r0.N_,{to:function(e){switch(e){case"blog":return"/blogs";case"gallery":return"/gallery";case"records":return"/notes";case"memory":return"/memory";case"travel":return"/travel";case"agenda":return"/agenda";case"capture":return"/capture";case"diagnostics":return"/diagnostics"}}(e.view),className:"site-nav-item",activeProps:{className:"site-nav-item active"},children:[(0,r.jsx)("span",{children:e.name}),(0,r.jsx)("small",{children:function(e){switch(e){case"blog":return"writing";case"gallery":return"images";case"records":return"notes / reading";case"memory":return"memory graph";case"travel":return"journeys";case"agenda":return"time";case"capture":return"capture";case"diagnostics":return"health"}}(e.view)})]},e.view))}),(0,r.jsx)("output",{id:"status",className:"site-status",children:t.staticSite?"static site-wide":"live source"})]})}function r2(e){let{title:t}=e;return(0,r.jsx)("section",{className:"site-hero",children:(0,r.jsxs)("div",{className:"hero-copy",children:[(0,r.jsx)("p",{className:"eyebrow",children:"Personal digital garden"}),(0,r.jsx)("h1",{id:"site-title",children:t}),(0,r.jsx)("p",{children:"把写作、札记、事件与行动议程放回同一个 Org 源头，让知识进入每天的实践。"})]})})}function r4(e){let{shell:t}=e;return(0,r.jsxs)("div",{className:"runtime-state","aria-hidden":"true",children:[(0,r.jsx)("strong",{id:"active-source-title",children:t.initialSource.name}),(0,r.jsxs)("small",{id:"active-source-path",children:[t.initialSource.file," / blog source"]})]})}let r6=(0,i.hy)()({component:function(){var e;let t=r6.useLoaderData(),a=(0,d.z)(),n=(e=a.pathname).startsWith("/gallery")?"gallery":e.startsWith("/notes")?"records":e.startsWith("/memory")?"memory":e.startsWith("/travel")?"travel":e.startsWith("/agenda")?"agenda":e.startsWith("/capture")?"capture":e.startsWith("/diagnostics")?"diagnostics":"blog",l=a.pathname.startsWith("/blogs/")?"zen":"library";return(0,u.useEffect)(()=>{document.documentElement.lang=t.siteConfig.locale,document.title=t.siteConfig.title;let e=document.querySelector("#app");e&&(e.dataset.view=n,e.dataset.readerMode=l)},[l,t.siteConfig.locale,t.siteConfig.title,n]),(0,r.jsx)(r1,{readerMode:l,shell:t,children:(0,r.jsx)(c.s,{})})},loader:e=>{let{context:t}=e;return ns(t)}}),r9=(0,i.un)({getParentRoute:()=>r6,path:"/",component:()=>(0,r.jsx)(o.C,{replace:!0,to:"/blogs"})}),r8=(0,i.un)({getParentRoute:()=>r6,path:"/blogs",component:function(){let e=r6.useLoaderData(),t=r8.useSearch(),n=(0,o.Z)(),l=(0,u.useMemo)(()=>rV({view:"blog",document:null,blogIndex:e.staticSite?.blog??null,blogTagFilter:t.tag??null,blogTimeFilter:t.time??null,blogZenMode:!1}),[t.tag,t.time,e.staticSite?.blog]);return(0,u.useEffect)(()=>{if(!l.includes("data-blog-virtual-list"))return;let e=new AbortController;return Promise.all([a.e(64),a.e(207)]).then(a.bind(a,9658)).then(t=>{let{bindBlogVirtualList:a}=t;e.signal.aborted||a(rY(),e.signal)}),()=>e.abort()},[l]),(0,r.jsx)(ng,{html:l,onClick:e=>{let a=e.target.closest("button[data-blog-article], button[data-blog-tag], button[data-blog-time]");if(a){if(e.preventDefault(),a.dataset.blogArticle)return void n({params:{articleId:a.dataset.blogArticle},search:a.dataset.blogSource?{source:a.dataset.blogSource}:{},to:"/blogs/$articleId"});if(void 0!==a.dataset.blogTag)return void n({search:{tag:a.dataset.blogTag||void 0,time:t.time},to:"/blogs"});void 0!==a.dataset.blogTime&&n({search:{tag:t.tag,time:a.dataset.blogTime||void 0},to:"/blogs"})}}})},validateSearch:e=>e}),r5=(0,i.un)({getParentRoute:()=>r6,path:"/blogs/$articleId",component:function(){let e=r6.useLoaderData(),t=r5.useLoaderData(),n=(0,o.Z)(),l=rV({view:"blog",document:t.document,articleHtml:t.html,blogArticleRangeStart:t.article.rangeStart,blogIndex:e.staticSite?.blog,blogZenMode:!0,sourceFile:t.source.sourceFile});return(0,u.useEffect)(()=>{let e=new AbortController;return a.e(772).then(a.bind(a,471)).then(t=>{let{bindBlogZenProgress:a}=t;e.signal.aborted||a(rY(),e.signal)}),()=>e.abort()},[l]),(0,u.useEffect)(()=>{let a=a=>{var r;if((r=a.target)instanceof HTMLElement&&r.closest("input, textarea, select, button, [contenteditable='true'], [role='textbox']"))return;if("Escape"===a.key){a.preventDefault(),n({to:"/blogs"});return}let l="ArrowRight"===a.key||"ArrowDown"===a.key?1:"ArrowLeft"===a.key||"ArrowUp"===a.key?-1:0;if(!l)return;let i=(e=>{let t,a,{currentRangeStart:r,currentSourceFile:n,direction:l,document:i,staticBlogIndex:o}=e,s=(t=i,a=o,a?.articles.length?a.articles.map(e=>({rangeStart:e.rangeStart,sourceFile:e.sourceFile})):t?p(t).map(e=>({rangeStart:e.rangeStart,sourceFile:null})):[]);if(0===s.length)return null;let d=s.findIndex(e=>e.rangeStart===r&&(!e.sourceFile||e.sourceFile===n)),c=d>=0?d:s.findIndex(e=>e.rangeStart===r),u=c>=0?(c+l+s.length)%s.length:l>0?0:s.length-1;return s[u]??null})({currentRangeStart:t.article.rangeStart,currentSourceFile:t.source.sourceFile,direction:l,document:t.document,staticBlogIndex:e.staticSite?.blog});i&&(a.preventDefault(),n({params:{articleId:String(i.rangeStart)},search:i.sourceFile?{source:i.sourceFile}:{},to:"/blogs/$articleId"}))};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[t,n,e.staticSite?.blog]),(0,r.jsx)(ng,{html:l})},loader:e=>{let{context:t,params:a}=e;return nd(t,a.articleId)},validateSearch:e=>e}),r7=(0,i.un)({getParentRoute:()=>r6,path:"/gallery",component:function(){let e=r6.useLoaderData(),t=rV({view:"gallery",document:null,attachmentGallery:e.staticSite?.attachmentGallery??null});return(0,u.useEffect)(()=>{if(!t.includes("data-attachment-open"))return;let e=new AbortController;return Promise.all([a.e(883),a.e(311)]).then(a.bind(a,4698)).then(t=>{let{bindAttachmentGalleryViewer:a}=t;e.signal.aborted||a(rY(),e.signal)}),()=>e.abort()},[t]),(0,r.jsx)(ng,{html:t})}}),ne=(0,i.un)({getParentRoute:()=>r6,path:"/notes",component:function(){let e=ne.useLoaderData();return(0,r.jsx)(ng,{html:rV({view:"records",document:null,siteNotes:e})})},loader:e=>{let{context:t}=e;return nc(t)}}),nt=(0,i.un)({getParentRoute:()=>r6,path:"/travel",component:function(){let e=r6.useLoaderData(),t=rV({view:"travel",document:null,travelView:e.staticSite?(e=>{if(e.travel)return e.travel;let t=rK.get(e);if(t)return t;let a=rr(e.sources.filter(rZ.B5).map(e=>({records:e.sectionIndex?.records??[],sourceFile:e.sourceFile,sourceName:e.name})));return rK.set(e,a),a})(e.staticSite):void 0});return(0,u.useEffect)(()=>{let e=new AbortController;return a.e(550).then(a.bind(a,5061)).then(t=>{let{bindTravelGlance:a,prefetchTravelGlanceRuntime:r}=t;e.signal.aborted||(a(rY(),e.signal),r())}),t.includes("data-travel-virtual-list")&&Promise.all([a.e(64),a.e(543)]).then(a.bind(a,8218)).then(t=>{let{bindTravelVirtualList:a}=t;e.signal.aborted||a(rY(),e.signal)}),()=>e.abort()},[t]),(0,r.jsx)(ng,{html:t})}}),na=(0,i.un)({getParentRoute:()=>r6,path:"/memory",component:function(){let e=na.useLoaderData();return(0,r.jsx)(ng,{html:rV({view:"memory",document:e.document,articleHtml:e.html,sourceFile:e.source.sourceFile})})},loader:e=>{let{context:t}=e;return nu(t,"memory",{attachmentInventory:!0,memory:!0,sectionIndex:!0})}}),nr=(0,i.un)({getParentRoute:()=>r6,path:"/agenda",component:function(){let e,t,a=nr.useLoaderData(),n=nr.useSearch(),l=r6.useLoaderData(),i="classic"===(e=n.agenda)||"strict"===e||"auto"===e||"agent"===e?n.agenda:l.siteConfig.agenda.mode,o="trace"===(t=n.panel)||"selectors"===t||"source"===t||"agent"===t||"records"===t?n.panel:"trace";return(0,r.jsx)(ng,{html:rV({view:"agenda",document:a.document,agendaMode:i,agendaPanel:o,agendaRuleId:n.rule??null})})},loader:e=>{let{context:t}=e;return nu(t,"agenda",{agenda:!0})},validateSearch:e=>e}),nn=(0,i.un)({getParentRoute:()=>r6,path:"/capture",component:function(){let e=nn.useLoaderData();return(0,r.jsx)(ng,{html:rV({view:"capture",document:e.document})})},loader:e=>{let{context:t}=e;return nu(t,"capture",{})}}),nl=(0,i.un)({getParentRoute:()=>r6,path:"/diagnostics",component:function(){let e=nl.useLoaderData();return(0,r.jsx)(ng,{html:rV({view:"diagnostics",document:e.document})})},loader:e=>{let{context:t}=e;return nu(t,"diagnostics",{})}}),ni=r6.addChildren([r9,r8,r5,r7,ne,nt,na,nr,nn,nl]),no=function(){let e,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{getQueryClient:rJ};return(0,s.a)({basepath:(e="/org-zhixing-ts".trim())&&"/"!==e?`/${e.replace(/^\/+|\/+$/g,"")}`:"/",context:t,defaultPreload:"intent",routeTree:ni})}();async function ns(e){return(await e.getQueryClient()).ensureQueryData({queryKey:["org-zhixing","content-shell"],queryFn:async()=>{let{loadContentShellData:e}=await Promise.all([a.e(634),a.e(476)]).then(a.bind(a,4039));return e()}})}async function nd(e,t){let r=await ns(e);return(await e.getQueryClient()).ensureQueryData({queryKey:["org-zhixing",r.staticSite?.generatedAt??"dynamic","article",t],queryFn:async()=>{let{loadBlogArticleData:e}=await Promise.all([a.e(634),a.e(476)]).then(a.bind(a,4039));return e(t,r)}})}async function nc(e){let t=await ns(e);return(await e.getQueryClient()).ensureQueryData({queryKey:["org-zhixing",t.staticSite?.generatedAt??"dynamic","notes"],queryFn:async()=>{let{loadSiteNotesData:e}=await Promise.all([a.e(634),a.e(476)]).then(a.bind(a,4039));return e(t)}})}async function nu(e,t,r){let n=await ns(e);return(await e.getQueryClient()).ensureQueryData({queryKey:["org-zhixing",n.staticSite?.generatedAt??"dynamic","document",t,n.initialSource.sourceFile],queryFn:async()=>{let{loadStaticDocumentData:e}=await Promise.all([a.e(634),a.e(476)]).then(a.bind(a,4039));return e(n,r)}})}function ng(e){let{html:t,onClick:a}=e;return(0,r.jsx)("div",{id:"view",onClick:a,dangerouslySetInnerHTML:{__html:t}})}let np=document.querySelector("#app");if(!np)throw Error("missing #app root");(0,l.createRoot)(np).render((0,r.jsx)(n.p,{router:no}))},6893(e,t,a){a.d(t,{Ft:()=>o,b4:()=>i,qX:()=>s,sp:()=>l});let r=["current","background","closed","archived"],n={current:{label:"Current",summary:"Active TODO, schedule, deadline, or planning evidence."},background:{label:"Background",summary:"Stable context without active task lifecycle."},closed:{label:"Closed",summary:"DONE/CLOSED evidence retained as historical memory."},archived:{label:"Archived",summary:"Archive metadata preserved but suppressed for active decisions."}},l=e=>({response:e,groups:r.map(t=>d(e,t)),topEvidence:c(e.evidenceKinds),topAuthority:c(e.authorityKinds)}),i=e=>n[e].label,o=e=>`L${e.start.line}:${e.start.column}`,s=e=>`memory-record-${e.rangeStart}`,d=(e,t)=>({state:t,label:n[t].label,summary:n[t].summary,records:e.records.filter(e=>e.state===t),cards:e.cards.filter(e=>e.decision.kind===t)}),c=e=>{let t=Math.max(1,...e.map(e=>e.count));return[...e].sort((e,t)=>t.count-e.count||e.label.localeCompare(t.label)).slice(0,10).map(e=>({...e,weight:e.count/t}))}},4496(e,t,a){a.d(t,{$N:()=>r,SN:()=>s,Tx:()=>i,as:()=>n,dc:()=>o,sn:()=>d,wZ:()=>l});let r=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],r=f(e),n=v(e),l=y(e),i=b(e,null);return{sectionIndex:e,semanticSections:a,recordsByTag:r,recordsByRangeStart:n,agenda:l,agendaView:null,agendaRange:null,attachmentInventory:null,agentMemory:null,capturePlan:null,captureRequest:null,captureApplyPreview:null,counts:{blog:c(e,a).length,attachments:r.get("attach")?.length??0,records:i.length,memory:r.get("memory")?.length??0,agenda:l.length},lint:t}},n=(e,t,a)=>({...e,agendaView:t,agendaRange:a,counts:{...e.counts,agenda:t.cards.length}}),l=(e,t)=>({...e,attachmentInventory:t,counts:{...e.counts,attachments:t.display.length,records:b(e.sectionIndex,t).length}}),i=(e,t)=>({...e,agentMemory:t,counts:{...e.counts,memory:t.response.stats.totalRecords}}),o=e=>e?b(e.sectionIndex,e.attachmentInventory):[],s=e=>e?c(e.sectionIndex,e.semanticSections):[],d=e=>e?.attachmentInventory?.display??[],c=(e,t)=>{let a=t[0];if(a)return[u(a)];let r=e[0];return r?[r]:[]},u=e=>({bodyPreview:g(e),effectiveTags:e.effectiveTags,level:e.level,outline:(e.outlinePathText??e.outlinePath).join(" / "),planning:{closed:h(e.planning.closed),deadline:h(e.planning.deadline),scheduled:h(e.planning.scheduled)},properties:e.properties,rangeStart:e.source.rangeStart,title:p(e),todo:e.todo,todoState:e.todoState}),g=e=>e.body.map(e=>e.text.trim()).filter(Boolean).join("\n\n").slice(0,260),p=e=>e.titleText||m(e.title),m=e=>e.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1"),h=e=>e?"string"==typeof e?e:"object"==typeof e&&"raw"in e&&"string"==typeof e.raw?e.raw:null:null,f=e=>{let t=new Map;for(let a of e)for(let e of a.effectiveTags){let r=$(e),n=t.get(r);n?n.push(a):t.set(r,[a])}return t},v=e=>{let t=new Map;for(let a of e)t.set(a.rangeStart,a);return t},y=e=>{let t=[];for(let a of e)k(t,a,"scheduled"),k(t,a,"deadline"),k(t,a,"closed");return t.sort((e,t)=>e.rangeStart-t.rangeStart)},$=e=>e.toLowerCase(),b=(e,t)=>{let a=new Set(t?.display.map(e=>e.source.rangeStart)??[]);return e.filter(e=>w(e,a))},w=(e,t)=>{if(!e.title.trim())return!1;let a=new Set(e.effectiveTags.map($));return a.has("record")||a.has("attach")||t.has(e.rangeStart)},k=(e,t,a)=>{let r=t.planning[a];r&&e.push({kind:a,title:t.title,tags:t.effectiveTags,value:r,rangeStart:t.rangeStart})}},290(e,t,a){a.d(t,{un:()=>A,B5:()=>x,Sc:()=>S,HU:()=>k,W8:()=>w,OD:()=>$,y:()=>b,M9:()=>v,Hh:()=>y,mH:()=>C});var r=a(7187),n=a(6893),l=a(4496);let i=new WeakMap,o=null,s=(e,t,a,r,n)=>d(e).then(l=>l.fetchQuery({queryKey:["org-zhixing-static-shard",e.generatedAt,t,a,r],queryFn:()=>n(r),staleTime:1/0,gcTime:1/0})),d=async e=>{let t=i.get(e);if(t)return t;let{QueryClient:a}=await c(),r=new a({defaultOptions:{queries:{gcTime:1/0,retry:!1,staleTime:1/0}}});return i.set(e,r),r},c=()=>o??=a.e(10).then(a.bind(a,7945)),u=async e=>{let t=await f(e);return t?.viewIndex&&void 0!==t.html?t:null},g=async e=>{let t=await f(e);return t?.schemaVersion===1&&t.agendaView?t:null},p=async e=>{let t=await f(e);return t?.schemaVersion===1&&t.memory?t.memory:null},m=async e=>{let t=await f(e);return t?.schemaVersion===1&&t.sectionIndex?t.sectionIndex:null},h=async e=>{let t=await f(e);return t?.schemaVersion===1&&t.attachmentInventory?t.attachmentInventory:null},f=async e=>{try{let t=await fetch((0,r.Vo)(e));if(!t.ok)return null;return await t.json()}catch{return null}},v=async()=>{try{let e=await fetch((0,r.Vo)("org-zhixing.static.json"));if(!e.ok)return null;let t=await e.json();if(1!==t.schemaVersion||!Array.isArray(t.sources))return null;return t}catch{return null}},y=async(e,t)=>{if(!e)return null;let a=T(e,t)??null;return a?N(e,a):null},$=async(e,t)=>{if(!e)return null;if(x(t)&&t.memory)return t.memory;let a=T(e,t);if(a&&x(a)&&a.memory)return a.memory;let r=a?.memoryShardPath??("memoryShardPath"in t?t.memoryShardPath:void 0);return r?s(e,"memory",a?.sourceFile??t.sourceFile,r,p):null},b=async(e,t)=>{if(!e)return null;if(x(t)&&t.sectionIndex)return t.sectionIndex;let a=T(e,t);if(a&&x(a)&&a.sectionIndex)return a.sectionIndex;let r=a?.sectionShardPath??("sectionShardPath"in t?t.sectionShardPath:void 0);return r?s(e,"section",a?.sourceFile??t.sourceFile,r,m):null},w=async(e,t)=>{if(!e)return null;if(x(t)&&t.attachmentInventory)return t.attachmentInventory;let a=T(e,t);if(a&&x(a)&&a.attachmentInventory)return a.attachmentInventory;let r=a?.attachmentShardPath??("attachmentShardPath"in t?t.attachmentShardPath:void 0);return r?s(e,"attachment",a?.sourceFile??t.sourceFile,r,h):null},k=async(e,t)=>{if(!e)return null;if(x(t)&&t.agendaView)return{schemaVersion:1,sourceId:t.id,sourceFile:t.sourceFile,agendaRange:t.agendaRange,agendaView:t.agendaView};let a=T(e,t);if(a&&x(a)&&a.agendaView)return{schemaVersion:1,sourceId:a.id,sourceFile:a.sourceFile,agendaRange:a.agendaRange,agendaView:a.agendaView};let r=a?.agendaShardPath??("agendaShardPath"in t?t.agendaShardPath:void 0);return r?s(e,"agenda",a?.sourceFile??t.sourceFile,r,g):null},S=async function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e?(await Promise.all(e.sources.map(async a=>{let r=await N(e,a);if(!r)return null;let[n,l]=await Promise.all([t.sectionIndex?b(e,r):Promise.resolve(null),t.attachmentInventory?w(e,r):Promise.resolve(null)]);return O(r=E(r,n),l)}))).filter(e=>!!e):[]},C=(e,t)=>{let a=t?.sources.map(e=>({id:e.id,name:e.orgTitle??e.name,file:e.file,sourceFile:e.sourceFile}))??[];return a.length>0?{...e,sources:a}:e},x=e=>"viewIndex"in e,A=(e,t)=>{let a=L(t,"memory",e.memory??null),r=L(t,"sectionIndex",e.sectionIndex??null),i=L(t,"attachmentInventory",e.attachmentInventory??null),o=L(t,"agendaView",e.agendaView??null),s=L(t,"agendaRange",e.agendaRange??t.agenda)??t.agenda,d=(0,l.$N)(e.viewIndex.records,e.lint.findings,r?.records??[]);return i&&(d=(0,l.wZ)(d,i)),a&&(d=(0,l.Tx)(d,(0,n.sp)(a))),o?(0,l.as)(d,o,s):d},E=(e,t)=>t?{...e,sectionIndex:t}:e,O=(e,t)=>t?{...e,attachmentInventory:t}:e,T=(e,t)=>e.sources.find(e=>e.sourceFile===t.sourceFile||e.file===t.file||e.id===t.id)??null,N=async(e,t)=>x(t)?t:t.shardPath?s(e,"source",t.sourceFile,t.shardPath,u):null,L=(e,t,a)=>Object.prototype.hasOwnProperty.call(e,t)?e[t]??null:a}},s={};function d(e){var t=s[e];if(void 0!==t)return t.exports;var a=s[e]={exports:{}};return o[e].call(a.exports,a,a.exports,d),a.exports}d.m=o,t=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.__proto__,d.t=function(a,r){if(1&r&&(a=this(a)),8&r||"object"==typeof a&&a&&(4&r&&a.__esModule||16&r&&"function"==typeof a.then))return a;var n=Object.create(null);d.r(n);var l={};e=e||[null,t({}),t([]),t(t)];for(var i=2&r&&a;("object"==typeof i||"function"==typeof i)&&!~e.indexOf(i);i=t(i))Object.getOwnPropertyNames(i).forEach(e=>{l[e]=()=>a[e]});return l.default=()=>a,d.d(n,l),n},d.d=(e,t)=>{for(var a in t)d.o(t,a)&&!d.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},d.f={},d.e=e=>Promise.all(Object.keys(d.f).reduce((t,a)=>(d.f[a](e,t),t),[])),d.u=e=>"assets/"+e+"."+({10:"b3e89ac7",207:"8d983d56",311:"0d0a52a4",404:"3c96fb11",43:"dbf8c8f5",476:"efe2803c",543:"81f6270d",550:"184c2fb4",581:"fd02cb84",594:"ddc1e80d",634:"437f5d75",64:"eb8725cb",711:"645f5fe8",767:"4fb4ee82",772:"84de2647",883:"083266ee"})[e]+".js",d.miniCssF=e=>""+e+".css",d.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),a={},d.l=function(e,t,r,n){if(a[e])return void a[e].push(t);if(void 0!==r)for(var l,i,o=document.getElementsByTagName("script"),s=0;s<o.length;s++){var c=o[s];if(c.getAttribute("src")==e||c.getAttribute("data-rspack")=="org-zhixing:"+r){l=c;break}}l||(i=!0,(l=document.createElement("script")).timeout=120,d.nc&&l.setAttribute("nonce",d.nc),l.setAttribute("data-rspack","org-zhixing:"+r),l.src=e),a[e]=[t];var u=function(t,r){l.onerror=l.onload=null,clearTimeout(g);var n=a[e];if(delete a[e],l.parentNode&&l.parentNode.removeChild(l),n&&n.forEach(function(e){return e(r)}),t)return t(r)},g=setTimeout(u.bind(null,void 0,{type:"timeout",target:l}),12e4);l.onerror=u.bind(null,l.onerror),l.onload=u.bind(null,l.onload),i&&document.head.appendChild(l)},d.r=e=>{"u">typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r=[],d.O=(e,t,a,n)=>{if(t){n=n||0;for(var l=r.length;l>0&&r[l-1][2]>n;l--)r[l]=r[l-1];r[l]=[t,a,n];return}for(var i=1/0,l=0;l<r.length;l++){for(var[t,a,n]=r[l],o=!0,s=0;s<t.length;s++)(!1&n||i>=n)&&Object.keys(d.O).every(e=>d.O[e](t[s]))?t.splice(s--,1):(o=!1,n<i&&(i=n));if(o){r.splice(l--,1);var c=a();void 0!==c&&(e=c)}}return e},d.p="/org-zhixing-ts/",n={509:0},d.f.j=function(e,t){var a=d.o(n,e)?n[e]:void 0;if(0!==a)if(a)t.push(a[2]);else{var r=new Promise((t,r)=>a=n[e]=[t,r]);t.push(a[2]=r);var l=d.p+d.u(e),i=Error();d.l(l,function(t){if(d.o(n,e)&&(0!==(a=n[e])&&(n[e]=void 0),a)){var r=t&&("load"===t.type?"missing":t.type),l=t&&t.target&&t.target.src;i.message="Loading chunk "+e+" failed.\n("+r+": "+l+")",i.name="ChunkLoadError",i.type=r,i.request=l,a[1](i)}},"chunk-"+e,e)}},d.O.j=e=>0===n[e],l=(e,t)=>{var a,r,[l,i,o]=t,s=0;if(l.some(e=>0!==n[e])){for(a in i)d.o(i,a)&&(d.m[a]=i[a]);if(o)var c=o(d)}for(e&&e(t);s<l.length;s++)r=l[s],d.o(n,r)&&n[r]&&n[r][0](),n[r]=0;return d.O(c)},(i=self.rspackChunkorg_zhixing=self.rspackChunkorg_zhixing||[]).forEach(l.bind(null,0)),i.push=l.bind(null,i.push.bind(i));var c=d.O(void 0,["783","836"],()=>d(1477));c=d.O(c)})();