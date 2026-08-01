import WikiItemCard from "@/components/WikiItemCard";

type ArtifactCardProps = {
  name: string;
  img: string;
  href: string;
  rarity?: 4 | 5;
};

export default function ArtifactCard({
  name,
  img,
  href,
  rarity = 5,
}: ArtifactCardProps) {
  const image = img.startsWith("/") || img.startsWith("http")
    ? img
    : `/images/mini-artifacts/${img}`;

  return (
    <WikiItemCard
      name={name}
      image={image}
      href={href}
      rarityStars={rarity}
      fit="cover"
      fluid
    />
  );
}
