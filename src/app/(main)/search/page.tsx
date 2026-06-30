import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q;
  if (q) {
    redirect(`/discover?q=${encodeURIComponent(q)}`);
  }
  redirect('/discover');
}
