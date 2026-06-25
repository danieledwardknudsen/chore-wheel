export const formatAssigneeLabel = (name: string, emoji?: string | null): string =>
  emoji ? `${emoji} @${name}` : `@${name}`;
