// The mitigation programmes shown on the portal (index.html) and opened by
// programme.html?p=<slug>. Each programme keeps its data in its own Supabase
// schema (`schema`), created by supabase/schema.sql. To add a programme, add an
// entry here and a matching `select public.mitigation_setup_schema('<schema>');`
// line at the end of supabase/schema.sql, and list the schema in the
// mitigation-admin Edge Function and under Exposed schemas (see SETUP.md).
window.MITIGATION_PROGRAMMES = [
  {
    slug: 'landslide', schema: 'landslide', category: 'Earmarked', no: 1,
    name: 'National Landslide Risk Mitigation Programme', short: 'NLRMP',
    costCr: 1000, timeline: '',
    states: ['Himachal Pradesh', 'Uttarakhand', 'Mizoram', 'Nagaland', 'Manipur', 'Arunachal Pradesh', 'Sikkim',
             'Meghalaya', 'Assam', 'Tripura', 'Kerala', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'West Bengal']
  },
  {
    slug: 'drought', schema: 'drought', category: 'Earmarked', no: 2,
    name: 'Drought Mitigation Programme', short: 'DMP',
    costCr: 1200, timeline: '',
    states: []
  },
  {
    slug: 'erosion', schema: 'erosion', category: 'Earmarked', no: 3,
    name: 'Coastal & River Erosion', short: 'CRE',
    costCr: 1500, timeline: '',
    states: ['Andhra Pradesh', 'Assam', 'Bihar', 'Goa', 'Gujarat', 'Kerala', 'Karnataka', 'Maharashtra',
             'Odisha', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal']
  },
  {
    slug: 'resettlement', schema: 'resettlement', category: 'Earmarked', no: 4,
    name: 'Resettlement of People Affected by Erosion', short: 'RPAE',
    costCr: 1000, timeline: '',
    states: ['Andhra Pradesh', 'Assam', 'Bihar', 'Goa', 'Gujarat', 'Kerala', 'Karnataka', 'Maharashtra',
             'Odisha', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal']
  },
  {
    slug: 'glof', schema: 'glof', category: 'Non-Earmarked', no: 1,
    name: 'Glacial Lake Outburst Flood (GLOF) Risk Reduction Programme', short: 'GLOF',
    costCr: 150, timeline: '',
    states: ['Arunachal Pradesh', 'Sikkim', 'Uttarakhand', 'Himachal Pradesh']
  },
  {
    slug: 'riverine', schema: 'riverine', category: 'Non-Earmarked', no: 2,
    name: 'Riverine Flood Mitigation Programme',
    detail: 'Restoration and rejuvenation of wetlands of Assam to enhance water retention capacity and mitigate risk of flooding and erosion.',
    short: 'RFMP', costCr: 692.05, timeline: '',
    states: ['Assam']
  },
  {
    slug: 'earthquake', schema: 'earthquake', category: 'Non-Earmarked', no: 3,
    name: 'National Earthquake Risk Mitigation Programme (NERMP)', short: 'NERMP',
    costCr: 1500, timeline: '',
    states: ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim',
             'Uttarakhand', 'Himachal Pradesh', 'Gujarat']
  },
  {
    slug: 'border-flood', schema: 'border_flood', category: 'Non-Earmarked', no: 4,
    name: 'Flood Protection Works in Border Areas',
    detail: 'Flood protection works in border areas to protect the BOPs along the Indo-Pak boundary fencing and other defence infrastructure established in terms of national security.',
    short: 'FPWBA', costCr: 78.04, timeline: '',
    states: ['Punjab']
  },
  {
    slug: 'coastal', schema: 'coastal', category: 'Non-Earmarked', no: 5,
    name: 'Integrated Coastal Risk Mitigation and Resilience Programme', short: 'ICRMRP',
    costCr: 2988, timeline: '',
    states: ['Andhra Pradesh', 'Odisha', 'West Bengal', 'Goa', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra']
  }
];

// Approximate centre of each state for the map dots, and its name in the
// map's boundary data (which spells a few states differently).
window.MITIGATION_STATE_INFO = {
  'Andhra Pradesh':    { lat: 15.6, lng: 79.7 },
  'Arunachal Pradesh': { lat: 28.1, lng: 94.6 },
  'Assam':             { lat: 26.2, lng: 92.9 },
  'Bihar':             { lat: 25.8, lng: 85.6 },
  'Chhattisgarh':      { lat: 21.3, lng: 81.9, boundary: 'Chhattishgarh' },
  'Goa':               { lat: 15.35, lng: 74.05 },
  'Gujarat':           { lat: 22.6, lng: 71.6 },
  'Haryana':           { lat: 29.1, lng: 76.2 },
  'Himachal Pradesh':  { lat: 31.9, lng: 77.2 },
  'Jharkhand':         { lat: 23.6, lng: 85.3 },
  'Karnataka':         { lat: 15.0, lng: 75.7 },
  'Kerala':            { lat: 10.4, lng: 76.4 },
  'Madhya Pradesh':    { lat: 23.5, lng: 78.5 },
  'Maharashtra':       { lat: 19.4, lng: 76.1 },
  'Manipur':           { lat: 24.7, lng: 93.9 },
  'Meghalaya':         { lat: 25.5, lng: 91.3 },
  'Mizoram':           { lat: 23.4, lng: 92.8 },
  'Nagaland':          { lat: 26.1, lng: 94.4 },
  'Odisha':            { lat: 20.5, lng: 84.4 },
  'Punjab':            { lat: 30.9, lng: 75.4 },
  'Rajasthan':         { lat: 26.6, lng: 73.8 },
  'Sikkim':            { lat: 27.5, lng: 88.5 },
  'Tamil Nadu':        { lat: 11.0, lng: 78.4, boundary: 'Tamilnadu' },
  'Telangana':         { lat: 17.9, lng: 79.0, boundary: 'Telengana' },
  'Tripura':           { lat: 23.8, lng: 91.7 },
  'Uttar Pradesh':     { lat: 27.0, lng: 80.6 },
  'Uttarakhand':       { lat: 30.1, lng: 79.2 },
  'West Bengal':       { lat: 23.3, lng: 87.9 },
  'Delhi':             { lat: 28.65, lng: 77.15 },
  'Jammu and Kashmir': { lat: 33.6, lng: 75.0 },
  'Ladakh':            { lat: 34.3, lng: 77.6 },
  'Puducherry':        { lat: 11.93, lng: 79.8 },
  'Chandigarh':        { lat: 30.73, lng: 76.78 }
};
