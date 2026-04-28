export const readerKeys = {
  all: ["reader"] as const,
  manifests: () => [...readerKeys.all, "manifest"] as const,
  manifest: (chapterId: string) => [...readerKeys.manifests(), chapterId] as const,
};
