import catalog from "@/content/catalog.generated.json";

export type ResourceType = "note" | "exam" | "exercise" | "summary" | "experiment";

export interface Course {
  id: string;
  name: string;
  college: string;
  description: string;
  icon: string;
  accent: string;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: ResourceType;
  description: string;
  format: "pdf" | "md";
  updatedAt: string;
  objectKey: string;
  fileName: string;
  size: number;
  sha256: string;
}

export const courses = catalog.courses as Course[];
export const resources = catalog.resources as unknown as Resource[];

function encodedObjectKey(objectKey: string) {
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

export function resourceFileUrl(resource: Resource, download = false) {
  const base = `/files/${encodedObjectKey(resource.objectKey)}`;
  if (!download) return base;
  const query = new URLSearchParams({ download: "1", name: resource.fileName });
  return `${base}?${query}`;
}
