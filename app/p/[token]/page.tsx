interface Props {
  params: { token: string };
}

export default function PublicProfilePage({ params }: Props) {
  return <main className="font-heading text-4xl p-8">Public Profile: {params.token}</main>;
}
