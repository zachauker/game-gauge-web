import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ genre: string }>;
}

export default async function GenrePage({ params }: Props) {
  const { genre } = await params;
  redirect(`/discover?genre=${encodeURIComponent(genre)}`);
}
