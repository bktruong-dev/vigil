// A small gazetteer for putting stories on the map. We look for a place name
// in the title first, then an organisation, then the same in the summary.
// Organisations map to their headquarters. Coordinates are [lon, lat].

export interface Place { name: string; country: string; lon: number; lat: number }

const P = (name: string, country: string, lon: number, lat: number): Place => ({ name, country, lon, lat });

const SF = P('San Francisco', 'United States', -122.42, 37.77);
const LONDON = P('London', 'United Kingdom', -0.13, 51.51);
const DC = P('Washington, D.C.', 'United States', -77.04, 38.9);
const BRUSSELS = P('Brussels', 'European Union', 4.35, 50.85);
const BEIJING = P('Beijing', 'China', 116.4, 39.9);

// Places, matched as whole words, case-sensitive.
export const PLACES: [string, Place][] = [
  // US cities and states
  ['San Francisco', SF], ['Silicon Valley', P('Silicon Valley', 'United States', -122.03, 37.37)],
  ['California', P('Sacramento', 'United States', -121.49, 38.58)],
  ['New York', P('New York', 'United States', -74.0, 40.71)], ['Texas', P('Austin', 'United States', -97.74, 30.27)],
  ['Florida', P('Tallahassee', 'United States', -84.28, 30.44)], ['Oklahoma', P('Oklahoma City', 'United States', -97.52, 35.47)],
  ['Illinois', P('Chicago', 'United States', -87.63, 41.88)], ['Chicago', P('Chicago', 'United States', -87.63, 41.88)],
  ['Colorado', P('Denver', 'United States', -104.99, 39.74)], ['Utah', P('Salt Lake City', 'United States', -111.89, 40.76)],
  ['Washington state', P('Seattle', 'United States', -122.33, 47.61)], ['Seattle', P('Seattle', 'United States', -122.33, 47.61)],
  ['Massachusetts', P('Boston', 'United States', -71.06, 42.36)], ['Boston', P('Boston', 'United States', -71.06, 42.36)],
  ['Michigan', P('Detroit', 'United States', -83.05, 42.33)], ['Ohio', P('Columbus', 'United States', -83.0, 39.96)],
  ['Pennsylvania', P('Philadelphia', 'United States', -75.17, 39.95)], ['New Jersey', P('Newark', 'United States', -74.17, 40.74)],
  ['Arizona', P('Phoenix', 'United States', -112.07, 33.45)], ['Nevada', P('Las Vegas', 'United States', -115.14, 36.17)],
  ['Wisconsin', P('Madison', 'United States', -89.4, 43.07)], ['Minnesota', P('Minneapolis', 'United States', -93.27, 44.98)],
  ['Tennessee', P('Nashville', 'United States', -86.78, 36.16)], ['Virginia', P('Richmond', 'United States', -77.44, 37.54)],
  ['Los Angeles', P('Los Angeles', 'United States', -118.24, 34.05)], ['Miami', P('Miami', 'United States', -80.19, 25.76)],
  ['Congress', DC], ['White House', DC], ['Senate', DC], ['Pentagon', DC], ['FTC', DC], ['Washington', DC],
  // Europe
  ['European Union', BRUSSELS], ['EU', BRUSSELS], ['Brussels', BRUSSELS], ['European Commission', BRUSSELS],
  ['United Kingdom', LONDON], ['UK', LONDON], ['Britain', LONDON], ['British', LONDON], ['London', LONDON], ['England', LONDON],
  ['Scotland', P('Edinburgh', 'United Kingdom', -3.19, 55.95)],
  ['Ireland', P('Dublin', 'Ireland', -6.26, 53.35)], ['France', P('Paris', 'France', 2.35, 48.86)], ['Paris', P('Paris', 'France', 2.35, 48.86)],
  ['French', P('Paris', 'France', 2.35, 48.86)], ['Germany', P('Berlin', 'Germany', 13.4, 52.52)], ['German', P('Berlin', 'Germany', 13.4, 52.52)],
  ['Italy', P('Rome', 'Italy', 12.5, 41.9)], ['Italian', P('Rome', 'Italy', 12.5, 41.9)], ['Spain', P('Madrid', 'Spain', -3.7, 40.42)],
  ['Netherlands', P('Amsterdam', 'Netherlands', 4.9, 52.37)], ['Dutch', P('Amsterdam', 'Netherlands', 4.9, 52.37)],
  ['Sweden', P('Stockholm', 'Sweden', 18.07, 59.33)], ['Norway', P('Oslo', 'Norway', 10.75, 59.91)], ['Denmark', P('Copenhagen', 'Denmark', 12.57, 55.68)],
  ['Finland', P('Helsinki', 'Finland', 24.94, 60.17)], ['Poland', P('Warsaw', 'Poland', 21.01, 52.23)], ['Switzerland', P('Zurich', 'Switzerland', 8.54, 47.38)],
  ['Austria', P('Vienna', 'Austria', 16.37, 48.21)], ['Belgium', BRUSSELS], ['Portugal', P('Lisbon', 'Portugal', -9.14, 38.72)],
  ['Greece', P('Athens', 'Greece', 23.73, 37.98)], ['Ukraine', P('Kyiv', 'Ukraine', 30.52, 50.45)], ['Russia', P('Moscow', 'Russia', 37.62, 55.76)],
  ['Russian', P('Moscow', 'Russia', 37.62, 55.76)],
  // Asia and Oceania
  ['China', BEIJING], ['Chinese', BEIJING], ['Beijing', BEIJING], ['Shanghai', P('Shanghai', 'China', 121.47, 31.23)],
  ['Hong Kong', P('Hong Kong', 'China', 114.17, 22.32)], ['Taiwan', P('Taipei', 'Taiwan', 121.56, 25.03)],
  ['Japan', P('Tokyo', 'Japan', 139.69, 35.69)], ['Japanese', P('Tokyo', 'Japan', 139.69, 35.69)], ['Tokyo', P('Tokyo', 'Japan', 139.69, 35.69)],
  ['South Korea', P('Seoul', 'South Korea', 126.98, 37.57)], ['Korea', P('Seoul', 'South Korea', 126.98, 37.57)], ['Seoul', P('Seoul', 'South Korea', 126.98, 37.57)],
  ['Delhi', P('New Delhi', 'India', 77.21, 28.61)], ['Jamia', P('New Delhi', 'India', 77.21, 28.61)], ['Ghaziabad', P('Ghaziabad', 'India', 77.44, 28.67)], ['Noida', P('Noida', 'India', 77.39, 28.54)], ['Mumbai', P('Mumbai', 'India', 72.88, 19.08)], ['Bengaluru', P('Bengaluru', 'India', 77.59, 12.97)], ['Bangalore', P('Bengaluru', 'India', 77.59, 12.97)], ['Hyderabad', P('Hyderabad', 'India', 78.49, 17.39)], ['Kolkata', P('Kolkata', 'India', 88.36, 22.57)], ['Chennai', P('Chennai', 'India', 80.27, 13.08)],
  ['India', P('New Delhi', 'India', 77.21, 28.61)], ['Indian', P('New Delhi', 'India', 77.21, 28.61)],
  ['Singapore', P('Singapore', 'Singapore', 103.82, 1.35)], ['Indonesia', P('Jakarta', 'Indonesia', 106.85, -6.21)],
  ['Philippines', P('Manila', 'Philippines', 120.98, 14.6)], ['Vietnam', P('Hanoi', 'Vietnam', 105.83, 21.03)], ['Thailand', P('Bangkok', 'Thailand', 100.5, 13.76)],
  ['Malaysia', P('Kuala Lumpur', 'Malaysia', 101.69, 3.14)], ['Pakistan', P('Islamabad', 'Pakistan', 73.05, 33.68)],
  ['Australia', P('Canberra', 'Australia', 149.13, -35.28)], ['Australian', P('Canberra', 'Australia', 149.13, -35.28)],
  ['Sydney', P('Sydney', 'Australia', 151.21, -33.87)], ['New Zealand', P('Wellington', 'New Zealand', 174.78, -41.29)],
  ['Israel', P('Tel Aviv', 'Israel', 34.78, 32.09)], ['Gaza', P('Gaza', 'Palestine', 34.47, 31.5)], ['Iran', P('Tehran', 'Iran', 51.39, 35.69)],
  ['Saudi Arabia', P('Riyadh', 'Saudi Arabia', 46.68, 24.71)], ['UAE', P('Abu Dhabi', 'United Arab Emirates', 54.37, 24.45)],
  ['Dubai', P('Dubai', 'United Arab Emirates', 55.27, 25.2)], ['Qatar', P('Doha', 'Qatar', 51.53, 25.29)],
  // Americas and Africa
  ['Canada', P('Ottawa', 'Canada', -75.7, 45.42)], ['Canadian', P('Ottawa', 'Canada', -75.7, 45.42)], ['Toronto', P('Toronto', 'Canada', -79.38, 43.65)],
  ['Montreal', P('Montreal', 'Canada', -73.57, 45.5)], ['Mexico', P('Mexico City', 'Mexico', -99.13, 19.43)],
  ['Brazil', P('Brasília', 'Brazil', -47.88, -15.79)], ['Brazilian', P('Brasília', 'Brazil', -47.88, -15.79)],
  ['Argentina', P('Buenos Aires', 'Argentina', -58.38, -34.6)], ['Chile', P('Santiago', 'Chile', -70.67, -33.45)],
  ['Colombia', P('Bogotá', 'Colombia', -74.07, 4.71)], ['Peru', P('Lima', 'Peru', -77.04, -12.05)],
  ['South Africa', P('Pretoria', 'South Africa', 28.19, -25.75)], ['Nigeria', P('Abuja', 'Nigeria', 7.49, 9.06)],
  ['Kenya', P('Nairobi', 'Kenya', 36.82, -1.29)], ['Egypt', P('Cairo', 'Egypt', 31.24, 30.04)], ['Ghana', P('Accra', 'Ghana', -0.19, 5.6)],
  ['Ethiopia', P('Addis Ababa', 'Ethiopia', 38.75, 9.03)], ['Rwanda', P('Kigali', 'Rwanda', 30.06, -1.94)],
  // United States last, so a more specific place wins when both appear
  ['United States', DC], ['U.S.', DC], ['US', DC], ['American', DC], ['America', DC],
];

// Organisations, mapped to headquarters.
export const ORGS: [string, Place][] = [
  ['OpenAI', SF], ['ChatGPT', SF], ['Anthropic', SF], ['Claude', SF],
  ['DeepMind', LONDON], ['Gemini', P('Mountain View', 'United States', -122.08, 37.39)], ['Google', P('Mountain View', 'United States', -122.08, 37.39)],
  ['Meta', P('Menlo Park', 'United States', -122.18, 37.45)], ['Facebook', P('Menlo Park', 'United States', -122.18, 37.45)],
  ['Instagram', P('Menlo Park', 'United States', -122.18, 37.45)], ['Character.AI', P('Menlo Park', 'United States', -122.18, 37.45)],
  ['Microsoft', P('Redmond', 'United States', -122.12, 47.67)], ['Copilot', P('Redmond', 'United States', -122.12, 47.67)],
  ['Amazon', P('Seattle', 'United States', -122.33, 47.61)], ['Apple', P('Cupertino', 'United States', -122.03, 37.32)],
  ['Nvidia', P('Santa Clara', 'United States', -121.96, 37.35)], ['NVIDIA', P('Santa Clara', 'United States', -121.96, 37.35)],
  ['xAI', P('Palo Alto', 'United States', -122.14, 37.44)], ['Grok', P('Palo Alto', 'United States', -122.14, 37.44)],
  ['Tesla', P('Austin', 'United States', -97.74, 30.27)], ['Uber', SF], ['Waymo', P('Mountain View', 'United States', -122.08, 37.39)],
  ['Perplexity', SF], ['Scale AI', SF], ['Midjourney', SF], ['Stability AI', LONDON], ['Hugging Face', P('New York', 'United States', -74.0, 40.71)],
  ['Mistral', P('Paris', 'France', 2.35, 48.86)], ['DeepSeek', P('Hangzhou', 'China', 120.15, 30.27)], ['Alibaba', P('Hangzhou', 'China', 120.15, 30.27)],
  ['Qwen', P('Hangzhou', 'China', 120.15, 30.27)], ['Baidu', BEIJING], ['Tencent', P('Shenzhen', 'China', 114.06, 22.54)],
  ['ByteDance', BEIJING], ['TikTok', BEIJING], ['Samsung', P('Seoul', 'South Korea', 126.98, 37.57)],
  ['METR', P('Berkeley', 'United States', -122.27, 37.87)], ['Redwood Research', P('Berkeley', 'United States', -122.27, 37.87)],
  ['AI Security Institute', LONDON], ['AISI', LONDON], ['Clearview', P('New York', 'United States', -74.0, 40.71)],
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const compile = (list: [string, Place][]) => list.map(([k, p]) => [new RegExp(`(^|[^A-Za-z])${esc(k)}(?![A-Za-z])`), p] as const);
const PLACE_RE = compile(PLACES);
const ORG_RE = compile(ORGS);

function first(text: string, table: readonly (readonly [RegExp, Place])[]): Place | undefined {
  let best: { at: number; p: Place } | undefined;
  for (const [re, p] of table) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.at)) best = { at: m.index, p };
  }
  return best?.p;
}

export function locate(title: string, summary: string, fallback?: string): Place | undefined {
  return first(title, PLACE_RE) ?? first(title, ORG_RE) ?? first(summary, PLACE_RE) ?? first(summary, ORG_RE)
    ?? (fallback ? first(fallback, ORG_RE) : undefined);
}
