// Lightweight loader for the bundled demo log. We fetch from the static path
// rather than inlining (the JSON is ~225KB and we don't want it in the JS bundle).
export async function loadDemoLog(): Promise<string> {
  const url = `${import.meta.env.BASE_URL}demo.log`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load demo log: ${res.status}`);
  return res.text();
}
