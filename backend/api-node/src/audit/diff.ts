type Slice = Partial<{ title: string; description: string | null; done: boolean }>;

export function diffTodo(before: Slice, after: Slice) {
  const changed: string[] = [];
  const b = before ?? {};
  const a = after ?? {};
  (['title','description','done'] as const).forEach((k) => {
    if (b[k] !== a[k]) changed.push(k);
  });
  return { changed_fields: changed };
}
