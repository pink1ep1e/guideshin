import WikiItemCard from "@/components/WikiItemCard";

type ArtifactCardProps = {
  name: string;
  img: string;
  href: string;
  rarity?: 4 | 5;
  lore?: string | null;
};

export default function ArtifactCard({
  name,
  img,
  href,
  rarity = 5,
  lore,
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
      lore={lore}
      fluid
    />
  );
}
