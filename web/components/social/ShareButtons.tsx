"use client";

import { useState } from "react";
import { generateShareUrl, trackShare, type SharePlatform } from "@/lib/social-share";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  slug?: string;
  variant?: "row" | "column"; // row = horizontal, column = vertical list
}

type ButtonConfig = {
  platform: SharePlatform;
  label: string;
  icon: string;
  color: string;
};

const SHARE_BUTTONS: ButtonConfig[] = [
  { platform: "facebook", label: "Facebook", icon: "f", color: "#1877F2" },
  { platform: "twitter", label: "Twitter", icon: "𝕏", color: "#000000" },
  { platform: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2" },
  { platform: "zalo", label: "Zalo", icon: "Z", color: "#0084FF" },
  { platform: "email", label: "Email", icon: "✉", color: "#666666" },
  { platform: "copy", label: "Copy", icon: "📋", color: "#999999" },
];

export function ShareButtons({
  url,
  title,
  description = "",
  slug = "",
  variant = "row",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: SharePlatform) => {
    trackShare(platform, slug, title);

    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const shareUrl = generateShareUrl(platform, { url, title, description });
    window.open(shareUrl, `share-${platform}`, "width=600,height=400");
  };

  const containerClass =
    variant === "row"
      ? "share-buttons share-buttons--row"
      : "share-buttons share-buttons--column";

  return (
    <div className={containerClass}>
      {SHARE_BUTTONS.map((btn) => (
        <button
          key={btn.platform}
          onClick={() => handleShare(btn.platform)}
          className={`share-btn share-btn--${btn.platform}`}
          title={`Chia sẻ lên ${btn.label}`}
          aria-label={`Chia sẻ lên ${btn.label}`}
          style={{
            "--share-color": btn.color,
          } as React.CSSProperties}
        >
          <span className="share-btn__icon">{btn.icon}</span>
          <span className="share-btn__label">{btn.label}</span>
          {btn.platform === "copy" && copied && (
            <span className="share-btn__feedback">Đã copy!</span>
          )}
        </button>
      ))}

      <style jsx>{`
        .share-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .share-buttons--column {
          flex-direction: column;
          align-items: stretch;
        }

        .share-buttons--row {
          flex-direction: row;
        }

        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--share-color, #ccc);
          border-radius: 6px;
          background: white;
          color: var(--share-color, #666);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .share-btn:hover {
          background: var(--share-color, #f0f0f0);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .share-btn:active {
          transform: translateY(0);
        }

        .share-btn__icon {
          font-weight: bold;
          font-size: 1.1em;
        }

        .share-btn__label {
          white-space: nowrap;
        }

        .share-btn__feedback {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--share-color, #666);
          color: white;
          font-size: 0.75rem;
          font-weight: bold;
          animation: fadeInOut 0.6s ease;
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        @media (max-width: 768px) {
          .share-buttons--row {
            flex-direction: column;
            align-items: stretch;
          }

          .share-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
