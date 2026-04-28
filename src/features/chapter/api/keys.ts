export const chapterKeys = {
  all: ["chapter"] as const,
  lists: () => [...chapterKeys.all, "list"] as const,
  listByManga: (mangaSlug: string) => [...chapterKeys.lists(), mangaSlug] as const,
};
