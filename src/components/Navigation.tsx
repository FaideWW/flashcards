import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="flex gap-4">
      <Link href="/">
        <a>Home</a>
      </Link>
      <Link href="/cards">
        <a>Cards</a>
      </Link>
      <Link href="/review">
        <a>Review</a>
      </Link>
    </nav>
  );
}
