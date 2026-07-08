import Link from 'next/link';

/**
 * CategoryCard — used in the "Find the right device" section on the homepage.
 *
 * Props:
 *   title        {string}  — e.g. "Used Laptops"
 *   description  {string}  — e.g. "Business & student picks"
 *   href         {string}  — Next.js route, e.g. "/shop"
 *   linkLabel    {string}  — e.g. "Browse →"
 *   icon         {string}  — SVG path data (inner content of <svg>)
 */
export default function CategoryCard({ title, description, href, linkLabel, icon }) {
  return (
    <div className="category-card">
      <svg
        className="cat-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href} className="cat-link">
        {linkLabel}
      </Link>
    </div>
  );
}
