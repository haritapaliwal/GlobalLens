import React from "react";
import usePersonaStore from "../store/personaStore";

function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return "🌐";
  return iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export default function UserProfileBadge() {
  const { userName, userCountry } = usePersonaStore();

  if (!userName || !userCountry) return null;

  return (
    <div className="glass-card px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
      <span className="text-lg leading-none">{isoToFlag(userCountry)}</span>
      <span className="text-xs font-medium text-slate-300">
        Hi, <span className="text-white">{userName}</span>
      </span>
    </div>
  );
}
