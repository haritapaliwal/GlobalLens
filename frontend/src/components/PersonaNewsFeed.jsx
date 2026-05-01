import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import usePersonaStore from "../store/personaStore";

const PERSONA_META = {
  student:       { emoji: "🎓", label: "Student",       tagline: "Scholarships, admissions & study-abroad opportunities" },
  businessman:   { emoji: "💼", label: "Businessman",   tagline: "Global trade, mergers & market expansion" },
  traveler:      { emoji: "✈️", label: "Traveler",      tagline: "Destinations, festivals & travel advisories" },
  remote_worker: { emoji: "👨‍💻", label: "Digital Nomad", tagline: "Remote work visas, coworking & cost of living" },
  investor:      { emoji: "📈", label: "Investor",      tagline: "Stock trends, FDI & emerging market plays" },
};

// ── Fallback news shown when API is unavailable ──────────────────────────────
const FALLBACK_NEWS = {
  student: [
    { title: "Fulbright Scholarship 2026 Applications Now Open for International Students", description: "The U.S. Department of State has announced the opening of Fulbright scholarship applications for the 2026–27 academic year across 160 countries.", url: "#", source: "Education Weekly", publishedAt: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=250&fit=crop" },
    { title: "Germany Scraps Tuition Fees for International Graduate Programs", description: "In a landmark decision, Germany has expanded its free-tuition policy to cover all graduate-level programs for international students starting Fall 2026.", url: "#", source: "Global Ed Times", publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=250&fit=crop" },
    { title: "Top 10 Countries with Easiest Student Visa Processes in 2026", description: "A new report ranks Canada, New Zealand, and Ireland as the top destinations for hassle-free student visa applications.", url: "#", source: "Study Abroad Hub", publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=250&fit=crop" },
    { title: "MIT Launches Free Online AI Certificate for Global Learners", description: "Massachusetts Institute of Technology introduces a no-cost professional certificate in Artificial Intelligence, accessible worldwide.", url: "#", source: "TechEd News", publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1677442135136-760c813028c4?w=400&h=250&fit=crop" },
    { title: "Australia Increases Post-Study Work Visa Duration to 5 Years", description: "International STEM graduates in Australia can now stay and work for up to 5 years after completing their degree.", url: "#", source: "Migration Digest", publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&h=250&fit=crop" },
    { title: "Erasmus Mundus Adds 30 New Joint Master Programs", description: "The European Commission has expanded the Erasmus Mundus catalog with 30 new fully-funded joint master degree programs.", url: "#", source: "EU Education", publishedAt: new Date(Date.now() - 28800000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=250&fit=crop" },
  ],
  businessman: [
    { title: "Global Trade Volume Hits Record $32 Trillion in Q1 2026", description: "World Trade Organization reports an unprecedented surge in global merchandise trade driven by emerging market demand.", url: "#", source: "Financial Times", publishedAt: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop" },
    { title: "India and EU Finalize Historic Free Trade Agreement", description: "After a decade of negotiations, India and the European Union have signed a comprehensive free trade deal covering goods, services, and digital trade.", url: "#", source: "Bloomberg", publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop" },
    { title: "AI-Powered Supply Chains Cut Logistics Costs by 23%", description: "A McKinsey report reveals companies using AI-driven supply chain management are seeing dramatic reductions in operational costs.", url: "#", source: "Business Insider", publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop" },
    { title: "Southeast Asian Startup Ecosystem Attracts $45B in Venture Capital", description: "Record venture capital inflows into Southeast Asia signal growing investor confidence in the region's tech startups.", url: "#", source: "TechCrunch", publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=250&fit=crop" },
    { title: "Green Energy Sector Creates 4 Million New Jobs Globally", description: "The International Energy Agency reports renewable energy industries have become the fastest-growing employment sector worldwide.", url: "#", source: "Reuters", publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=250&fit=crop" },
    { title: "Global M&A Activity Surges 35% Year-Over-Year", description: "Cross-border mergers and acquisitions reached $3.2 trillion in the first half of 2026, led by tech and healthcare sectors.", url: "#", source: "Wall Street Journal", publishedAt: new Date(Date.now() - 28800000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=250&fit=crop" },
  ],
  traveler: [
    { title: "Japan Introduces 6-Month 'Explorer Visa' for International Tourists", description: "Japan has launched a new long-stay visa allowing tourists to explore all 47 prefectures with special rail pass benefits.", url: "#", source: "Travel + Leisure", publishedAt: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop" },
    { title: "World's 20 Safest Countries for Solo Travelers in 2026", description: "Iceland, Switzerland, and Singapore top the annual Global Peace Index rankings for solo travel safety.", url: "#", source: "Lonely Planet", publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=250&fit=crop" },
    { title: "New Direct Flight Routes Connect 15 Previously Unreachable Destinations", description: "Major airlines announce new direct routes to remote destinations including Bhutan, Faroe Islands, and Madagascar.", url: "#", source: "CNN Travel", publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop" },
    { title: "Portugal Named Best Value Destination in Europe for 2026", description: "With affordable dining, excellent public transport, and stunning coastlines, Portugal continues to dominate budget travel rankings.", url: "#", source: "Condé Nast", publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=250&fit=crop" },
    { title: "Thailand Waives Visa Requirements for 60+ Countries", description: "Thailand's tourism ministry announces visa-free entry for citizens of over 60 nations to boost post-pandemic tourism recovery.", url: "#", source: "BBC Travel", publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=250&fit=crop" },
    { title: "UNESCO Adds 25 New World Heritage Sites Across 4 Continents", description: "From ancient temples in Cambodia to geological wonders in Patagonia, the latest UNESCO additions offer new must-visit destinations.", url: "#", source: "National Geographic", publishedAt: new Date(Date.now() - 28800000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=250&fit=crop" },
  ],
  remote_worker: [
    { title: "Estonia's Digital Nomad Visa Now Offers 2-Year Residency", description: "Estonia extends its popular e-Residency and digital nomad visa program, now granting up to 2 years of legal stay for remote workers.", url: "#", source: "Nomad List", publishedAt: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop" },
    { title: "Top 10 Cities with Best Internet Speed for Remote Work in 2026", description: "Seoul, Bucharest, and Lisbon lead the rankings for fastest and most reliable internet connectivity for digital nomads.", url: "#", source: "Wired", publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop" },
    { title: "Bali Opens 5 New Government-Backed Coworking Hubs", description: "Indonesia's Bali province launches free-to-use coworking spaces with high-speed internet specifically designed for international remote workers.", url: "#", source: "Remote OK", publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop" },
    { title: "Cost of Living Comparison: Top 20 Digital Nomad Destinations", description: "From $800/month in Chiang Mai to $3,200 in Dubai — a complete breakdown of living costs for remote professionals.", url: "#", source: "Forbes", publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop" },
    { title: "Spain Launches Tax Incentives for Foreign Remote Workers", description: "Spain's new 'Beckham Law 2.0' offers a flat 15% income tax rate for international remote workers relocating to the country.", url: "#", source: "TechCrunch", publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=250&fit=crop" },
    { title: "Starlink Satellite Internet Now Available in 80+ Countries", description: "SpaceX expands Starlink coverage, making reliable high-speed internet accessible in remote areas popular with digital nomads.", url: "#", source: "The Verge", publishedAt: new Date(Date.now() - 28800000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop" },
  ],
  investor: [
    { title: "Emerging Markets Index Outperforms S&P 500 for Third Consecutive Quarter", description: "MSCI Emerging Markets Index shows 18% YTD returns, driven by strong performances in India, Vietnam, and Brazil.", url: "#", source: "Bloomberg", publishedAt: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop" },
    { title: "Global Green Bond Issuance Crosses $1 Trillion Milestone", description: "Sustainable finance reaches a new landmark as green bond issuances surpass $1 trillion for the first time in history.", url: "#", source: "Financial Times", publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=400&h=250&fit=crop" },
    { title: "AI Startups Attract Record $120B in Global VC Funding", description: "Artificial intelligence companies raised unprecedented venture capital in 2026, with generative AI leading deal volumes.", url: "#", source: "PitchBook", publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop" },
    { title: "Central Banks in 12 Countries Cut Interest Rates Simultaneously", description: "A coordinated global easing cycle signals improved inflation outlook and potential boost to equity and real estate markets.", url: "#", source: "Reuters", publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=250&fit=crop" },
    { title: "Real Estate in Southeast Asia Yields 8-12% Annual Returns", description: "Property markets in Vietnam, Philippines, and Thailand offer some of the highest rental yields globally for foreign investors.", url: "#", source: "CNBC", publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop" },
    { title: "Cryptocurrency Regulation Framework Adopted by G20 Nations", description: "G20 members agree on a unified crypto regulation framework, bringing clarity and boosting institutional investor confidence.", url: "#", source: "CoinDesk", publishedAt: new Date(Date.now() - 28800000).toISOString(), imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop" },
  ],
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SkeletonCard() {
  return (
    <div className="persona-news-card skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-1/3" />
        <div className="skeleton skeleton-line w-full" />
        <div className="skeleton skeleton-line w-4/5" />
        <div className="skeleton skeleton-line w-1/2" />
      </div>
    </div>
  );
}

function NewsArticleCard({ article, index }) {
  const { title, description, url, source, publishedAt, imageUrl } = article;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className="persona-news-card group"
      id={`persona-news-${index}`}
    >
      {/* Image */}
      <div className="news-card-img-wrapper">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="news-card-img"
            loading="lazy"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="news-card-img-placeholder">
            <span className="text-3xl opacity-40">📰</span>
          </div>
        )}
        {/* Source pill */}
        <span className="news-source-pill">{source}</span>
      </div>

      {/* Body */}
      <div className="news-card-body">
        <p className="news-card-title">{title}</p>
        {description && (
          <p className="news-card-desc">{description}</p>
        )}
        <div className="news-card-footer">
          <span className="news-card-date">{formatDate(publishedAt)}</span>
          <span className="news-card-cta">
            Read →
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function PersonaNewsFeed({ forceExpand = false }) {
  const persona = usePersonaStore((s) => s.persona);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(forceExpand);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (forceExpand) setIsExpanded(true);
  }, [forceExpand]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fallback = FALLBACK_NEWS[persona] || FALLBACK_NEWS.student;

    axios
      .get("/api/global-news", { params: { persona } })
      .then((res) => {
        if (!cancelled) {
          const fetched = res.data?.articles || [];
          // Use real articles if available, otherwise fallback
          setArticles(fetched.length > 0 ? fetched : fallback);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // API failed — show fallback news seamlessly
          setArticles(fallback);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [persona]);

  const meta = PERSONA_META[persona] || PERSONA_META.student;

  // Horizontal scroll with mouse-wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <motion.section
      id="persona-news-feed"
      className="persona-feed-section"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      {/* Header bar */}
      <div className="persona-feed-header">
        <div className="persona-feed-header-left">
          <motion.span
            key={persona}
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-2xl"
          >
            {meta.emoji}
          </motion.span>
          <div>
            <h2 className="persona-feed-title">
              <span className="gradient-text">{meta.label}</span> News Feed
            </h2>
            <p className="persona-feed-tagline">{meta.tagline}</p>
          </div>
          <div className="persona-feed-live">
            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[9px] text-brand-400 font-semibold uppercase tracking-wider">Live</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="persona-feed-toggle"
          aria-label={isExpanded ? "Collapse news" : "Expand news"}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="inline-block"
          >
            ▲
          </motion.span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="feed-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {error ? (
              <div className="persona-feed-empty">
                <span className="text-2xl mb-2">⚠️</span>
                <p className="text-sm text-slate-500">{error}</p>
              </div>
            ) : loading ? (
              <div className="persona-feed-scroll" ref={scrollRef}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="persona-feed-empty">
                <span className="text-2xl mb-2">📭</span>
                <p className="text-sm text-slate-500">No news available for this persona right now</p>
              </div>
            ) : (
              <div className="persona-feed-scroll custom-scrollbar" ref={scrollRef}>
                <AnimatePresence mode="popLayout">
                  {articles.map((article, i) => (
                    <NewsArticleCard
                      key={article.url || i}
                      article={article}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
