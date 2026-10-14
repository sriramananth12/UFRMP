// Builds mitigation/programme.html from the UFRMP dashboard (../index.html),
// so every mitigation programme page has the same features as the urban flood
// page, starts with no data, and saves to its own Supabase schema.
//
//   node mitigation/build.mjs
//
// Run it again after changing the UFRMP dashboard to carry the changes over.
// Each edit below must match the expected number of times; if the dashboard
// changed in a way an edit no longer fits, the build stops and says which.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let html = readFileSync(join(here, '..', 'index.html'), 'utf8');

function edit(find, replace, expected = 1) {
  const re = typeof find === 'string' ? new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : find;
  const found = (html.match(re) || []).length;
  if (expected !== 'any' && found !== expected) {
    throw new Error(`Expected ${expected} match(es) for ${re}, found ${found}. Update mitigation/build.mjs to fit the dashboard.`);
  }
  html = html.replace(re, typeof replace === 'string' ? () => replace : replace);
}

/* ---------- page head and static chrome ---------- */
edit('<title>Urban Flood Risk Management Programme (UFRMP)</title>', '<title>Mitigation Programme</title>');
edit('<script src="vendor/xlsx-0.18.5.full.min.js"></script>', '<script src="../vendor/xlsx-0.18.5.full.min.js"></script>');
edit('<script src="vendor/supabase-js-2.117.2.js"></script>',
  '<script src="../vendor/supabase-js-2.117.2.js"></script>\n' +
  '<!-- Mitigation portal: the programme list and the Supabase connection (see mitigation/SETUP.md) -->\n' +
  '<script src="programmes.js"></script>\n<script src="supabase-config.js"></script>');
edit(/\s*<picture>[\s\S]*?<\/picture>/, '');
edit('<h1>UFRMP Dashboard</h1>', '<h1 id="progLoginTitle">Programme Dashboard</h1>');
edit('<p>Urban Flood Risk Management Programme. Sign in with the username and password you were given.</p>',
  '<p><span id="progLoginName"></span>Sign in with the username and password you were given.</p>');
edit('<button class="btn" type="submit" id="loginBtn">Sign in</button>',
  '<button class="btn" type="submit" id="loginBtn">Sign in</button>\n' +
  '    <a href="index.html" style="display:block;text-align:center;margin-top:14px;font-size:12.5px;color:var(--water);">← All mitigation programmes</a>');
edit('<div class="brand-text">Urban Flood Risk<br>Management Programme</div>', '<div class="brand-text" id="progBrand">Mitigation Programme</div>');
edit('<div class="brand-sub">UFRMP · ALL CITIES</div>', '<div class="brand-sub">ALL STATES</div>');
edit('<button data-nav="dashboard" class="active">',
  '<button onclick="location.href=\'index.html\'" title="Back to the list of mitigation programmes">⌂ All Programmes</button>\n      <button data-nav="dashboard" class="active">');
edit('<div class="print-header-title">Urban Flood Risk Management Programme (UFRMP)</div>', '<div class="print-header-title" id="progPrintTitle">Mitigation Programme</div>');

/* ---------- which programme this page shows ---------- */
edit('<script>\n/* ---------------------------------------------------------------\n   DATA LAYER', `<script>
/* ---------------------------------------------------------------
   MITIGATION PORTAL: this page is opened as programme.html?p=<slug>
   and shows that programme from programmes.js. Its data lives in the
   programme's own Supabase schema (supabase/schema.sql), and its copy
   in this browser is kept apart from other programmes'.
--------------------------------------------------------------- */
const PROG_SLUG = new URLSearchParams(location.search).get('p') || '';
const PROG = (window.MITIGATION_PROGRAMMES || []).find(p=>p.slug===PROG_SLUG);
if(!PROG){ location.replace('index.html'); throw new Error('No mitigation programme "' + PROG_SLUG + '" in programmes.js'); }
const PROG_NS = 'mitigation-' + PROG.slug + ':';
const PROG_SUPABASE = window.MITIGATION_SUPABASE || {};
const STATE_INFO = window.MITIGATION_STATE_INFO || {};
function stateInfo(name){
  const key = String(name||'').trim().toLowerCase();
  const hit = Object.keys(STATE_INFO).find(n=>n.toLowerCase()===key);
  return hit ? STATE_INFO[hit] : null;
}
// Coordinates typed in the Add State form win; otherwise known states fill their own.
function stateLatLng(name, lat, lng){
  const s = stateInfo(name) || {};
  const pick = (typed, known)=> (typed===null || typed===undefined || String(typed).trim()==='') ? (known===undefined ? null : known) : Number(typed);
  return { lat: pick(lat, s.lat), lng: pick(lng, s.lng) };
}
function boundaryNameFor(name){
  const s = stateInfo(name);
  return s ? (s.boundary || Object.keys(STATE_INFO).find(n=>STATE_INFO[n]===s)) : null;
}
function fmtProgrammeCost(cr){
  return (cr===null || cr===undefined || cr==='') ? '—' : '₹' + Number(cr).toLocaleString('en-IN', {maximumFractionDigits:2}) + ' crore';
}
function renderProgrammeInfo(){
  const states = PROG.states || [];
  return \`<div class="kpi-row">
      <div class="kpi"><div class="label">Category</div><div class="value">\${esc(PROG.category)}</div><div class="sub">Mitigation programme no. \${esc(PROG.no)}</div></div>
      <div class="kpi"><div class="label">Approved / Proposed Cost</div><div class="value">\${fmtProgrammeCost(PROG.costCr)}</div></div>
      <div class="kpi"><div class="label">Indicative Timeline</div><div class="value">\${PROG.timeline ? esc(PROG.timeline) : '—'}</div><div class="sub">\${PROG.timeline ? '' : 'not set yet'}</div></div>
      <div class="kpi"><div class="label">States / UTs Covered</div><div class="value">\${states.length || '—'}</div><div class="sub">\${states.length ? esc(states.join(', ')) : 'not specified yet'}</div></div>
    </div>\`;
}
document.title = PROG.name + ' · Mitigation Portal';
document.getElementById('progBrand').textContent = PROG.name;
document.getElementById('progLoginTitle').textContent = PROG.short + ' Dashboard';
document.getElementById('progLoginName').textContent = PROG.name + '. ';
document.getElementById('progPrintTitle').textContent = PROG.name;

/* ---------------------------------------------------------------
   DATA LAYER`);

/* ---------- Supabase: shared config, this programme's schema ---------- */
edit(/const SUPABASE_URL = '[^']*';/, "const SUPABASE_URL = PROG_SUPABASE.url || '';");
edit(/const SUPABASE_ANON_KEY = '[^']*';/, "const SUPABASE_ANON_KEY = PROG_SUPABASE.anonKey || '';");
edit(/const SUPABASE_PROXY_URL = '[^']*';/, "const SUPABASE_PROXY_URL = PROG_SUPABASE.proxyUrl || '';");
edit("storageKey: 'ufrmp-auth' },\n      global: { fetch: sbFetch }",
  "storageKey: PROG_NS + 'auth' },\n      db: { schema: PROG.schema },\n      global: { fetch: sbFetch }");
edit("const LOGIN_EMAIL_DOMAIN = 'ufrmp.local'; // must match supabase/functions/ufrmp-admin/index.ts",
  "const LOGIN_EMAIL_DOMAIN = 'mitigation.local'; // must match mitigation/supabase/functions/mitigation-admin/index.ts");
edit("supabaseClient.functions.invoke('ufrmp-admin', { body: Object.assign({ action }, payload) })",
  "supabaseClient.functions.invoke('mitigation-admin', { body: Object.assign({ action, programme: PROG.schema }, payload) })");
edit('Logins are created and changed through the ufrmp-admin Edge', 'Logins are created and changed through the mitigation-admin Edge');
edit("const NS = 'ufrmp:';", 'const NS = PROG_NS;');
edit("const t='ufrmp:__test__';", "const t=PROG_NS+'__test__';");
edit("'ufrmp:lastUser'", "PROG_NS+'lastUser'", 3);
edit("k.startsWith('ufrmp:S:') || k.startsWith('ufrmp:P:')", "k.startsWith(PROG_NS+'S:') || k.startsWith(PROG_NS+'P:')");
edit('(async function init(){\n',
  "(async function init(){\n  if(!SUPABASE_URL || !SUPABASE_ANON_KEY) return showLogin('This portal is not connected to Supabase yet. Put the project URL and anon key in mitigation/supabase-config.js (see mitigation/SETUP.md).');\n");

/* ---------- start empty: no UFRMP data, the programme's states only ---------- */
edit(/^const SEED_DATA = .*$/m, 'const SEED_DATA = {"components":[],"dprs":[],"works":[],"timelines":[],"gantt":{}};');
edit(/^const MIGRATION_PATCH_V2 = .*$/m, 'const MIGRATION_PATCH_V2 = {"works":{},"dprs":{},"components":{}};');
edit(/^const MIGRATION_PATCH_V3 = .*$/m, 'const MIGRATION_PATCH_V3 = {"works":{},"dprs":{},"components":{},"newWorks":[]};');
edit(/^const BUDGET_MATRIX = .*$/m, 'const BUDGET_MATRIX = {};');
edit(/const CITY_OVERRIDES = \{[\s\S]*?\n\};\n/, 'const CITY_OVERRIDES = {};\n');
edit(/const CITY_COORDS = \{[\s\S]*?\n(?=\nconst PHASES)/, `// One entry per state the programme covers (programmes.js), with no amounts yet.
const CITY_SEED = (PROG.states || []).map(name=>{
  const s = stateInfo(name) || {};
  return {
    id: name.toLowerCase().replace(/[^a-z]/g,'') + '-p1', cityName: name, phase: 1, ndmfShareCr: null,
    stateShareCr: null, approvedProjectsAmountCr: null, ndrfShareCr: null,
    lat: s.lat === undefined ? null : s.lat, lng: s.lng === undefined ? null : s.lng
  };
});
`);
edit(/const CITY_STATE_MAP = \{[\s\S]*?\n\};\n/, '');
edit('const stateName = CITY_STATE_MAP[city.id] || stateForPoint(Number(city.lat), Number(city.lng));',
  'const stateName = boundaryNameFor(city.cityName) || stateForPoint(Number(city.lat), Number(city.lng));');
// Map dots skip any state that has no coordinates yet.
edit('const dots = (cities||DB.cityProgrammes).map(c=>{', 'const dots = (cities||DB.cityProgrammes).filter(c=>c.lat!=null && c.lng!=null && !isNaN(c.lat) && !isNaN(c.lng)).map(c=>{');

/* ---------- Add State form: known states fill in their own coordinates ---------- */
edit('<input required type="text" name="cityName" placeholder="e.g. Nagpur">',
  '<input required type="text" name="cityName" placeholder="e.g. Assam" list="stateNameList"><datalist id="stateNameList">${Object.keys(STATE_INFO).map(n=>`<option value="${esc(n)}">`).join(\'\')}</datalist>');
edit('<input required type="number" step="0.0001" name="lat" placeholder="e.g. 21.1458">', '<input type="number" step="0.0001" name="lat" placeholder="filled in for Indian states">');
edit('<input required type="number" step="0.0001" name="lng" placeholder="e.g. 79.0882">', '<input type="number" step="0.0001" name="lng" placeholder="filled in for Indian states">');
edit('      if(!cityName){ return; }\n',
  "      if(!cityName){ return; }\n      const ll = stateLatLng(cityName, fd.get('lat'), fd.get('lng'));\n" +
  "      if(ll.lat===null || ll.lng===null || isNaN(ll.lat) || isNaN(ll.lng)){ alert('Enter the latitude and longitude for ' + cityName + '. They fill in on their own only for Indian state names.'); return; }\n");
edit("lat: Number(fd.get('lat')), lng: Number(fd.get('lng')),", 'lat: ll.lat, lng: ll.lng,');

/* ---------- programme name and details instead of UFRMP ---------- */
edit('<div><h1>Urban Flood Risk Management Programme (UFRMP)</h1><p>Flood mitigation works across all cities and phases funded under the NDMF</p></div>\n    </div>\n    ${renderUnitToggle()}',
  '<div><h1>${esc(PROG.name)}</h1><p>${PROG.detail ? esc(PROG.detail) + \' \' : \'\'}${esc(PROG.category)} mitigation programme · works across all states and phases</p></div>\n    </div>\n    ${renderProgrammeInfo()}\n    ${renderUnitToggle()}');
edit('<p>UFRMP Phase ${phase} city programmes funded under the NDMF', '<p>${esc(PROG.short)} Phase ${phase} state programmes funded under the NDMF');
edit('XLSX.writeFile(wb, `UFRMP_Data_Tables_${stamp}.xlsx`);', 'XLSX.writeFile(wb, `${PROG.short}_Data_Tables_${stamp}.xlsx`);');
edit("isMaster() ? 'UFRMP · ALL CITIES' : 'UFRMP · ' + (city ? city.cityName.toUpperCase() : 'CITY')",
  "isMaster() ? PROG.short + ' · ALL STATES' : PROG.short + ' · ' + (city ? city.cityName.toUpperCase() : 'STATE')");

/* ---------- contacts: state-level roles instead of Mayor / Commissioner ---------- */
edit("{key:'mayor', label:'Mayor',", "{key:'mayor', label:'Nodal Department',");
edit("{key:'commissioner', label:'Commissioner',", "{key:'commissioner', label:'Nodal Officer',");
edit('Mayor, Commissioner and SDMA', 'Nodal Department, Nodal Officer and SDMA', 3);

/* ---------- drop UFRMP-only examples ---------- */
edit(" (Ahmedabad and Mumbai are in Phase 1 and Phase 3)", '');
edit('placeholder="e.g. Storm Water Drain Network — Zone 3"', 'placeholder="e.g. Mitigation Works — Package 1"');
edit('placeholder="e.g. Storm Water Drainage / Lake Rejuvenation"', 'placeholder="e.g. Structural / Non-Structural"');

/* ---------- wording: states instead of cities ---------- */
edit(/cit\$\{([^}]*?)\?'y':'ies'\}/g, (m, cond) => `state\${${cond}?'':'s'}`, 'any');
edit(/\bCities\b/g, 'States', 'any');
edit(/\bCity\b/g, 'State', 'any');
edit('city positions are approximate', 'state positions are approximate', 'any');
edit(/\b(the|this|that|a|own|your|their|every|each|all|per|whose|different|new|its|distinct|unchanged|then|across|one|no|phase's|work's)(\s+)(city|cities)\b/gi,
  (m, w, sp, c) => w + sp + (c.toLowerCase() === 'city' ? 'state' : 'states'), 'any');
edit(/(\$\{[^}]*\}) (city|cities)\b/g, (m, expr, c) => expr + ' ' + (c === 'city' ? 'state' : 'states'), 'any');

writeFileSync(join(here, 'programme.html'), html);
console.log('Wrote mitigation/programme.html (' + Math.round(html.length / 1024) + ' KB)');
