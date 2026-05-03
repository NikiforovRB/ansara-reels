import { redirect } from "next/navigation";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function ProjectIndex({ params }: Params) {
  const { id } = await params;
  redirect(`/projects/${id}/view`);
}
