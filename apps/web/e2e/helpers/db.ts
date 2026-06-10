// Uses Neon's HTTP SQL endpoint directly so we don't import @neondatabase/serverless
// (which has CJS/ESM interop issues in Playwright's esbuild context).
export const truncateTables = async () => {
  const dbUrl = process.env['DATABASE_URL_TEST'];
  if (!dbUrl) throw new Error('DATABASE_URL_TEST is not set');

  const host = new URL(dbUrl).hostname;

  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': dbUrl,
    },
    body: JSON.stringify({
      query:
        'TRUNCATE chores, chore_rule_assignees, chore_rules, passkeys, users RESTART IDENTITY CASCADE',
      params: [],
    }),
  });

  if (!res.ok) {
    throw new Error(`truncateTables failed: ${res.status} ${await res.text()}`);
  }
};
