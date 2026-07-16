import MemberDetailClient from "../components/MemberDetailClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <MemberDetailClient memberId={routeParams.id} />;
}
