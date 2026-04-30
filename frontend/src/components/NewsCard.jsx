import ConfidenceBadge from "./ConfidenceBadge";

/**
 * NewsCard — article card with title, source, date, external link, and confidence badge.
 */
export default function NewsCard({ article }) {
  const { title, source, publishedAt, url, confidence = "Low", description } = article;

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card-sm block p-3 hover:border-brand-700/40 transition-all duration-200 group hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide">
          {source}
        </span>
        <ConfidenceBadge level={confidence} />
      </div>

      <p className="text-sm font-medium text-slate-100 group-hover:text-white leading-snug mb-1 line-clamp-2">
        {title}
      </p>

      {description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-600">{formattedDate}</span>
        <span className="text-[10px] text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Read article →
        </span>
      </div>
    </a>
  );
}
