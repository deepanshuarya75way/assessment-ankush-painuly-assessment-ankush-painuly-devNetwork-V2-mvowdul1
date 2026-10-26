export default function PremiumBadge({ user, size = "md" }) {
  if (!user?.subscription?.plan || user.subscription.plan === "free") {
    return null;
  }

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <span
      title="Premium user"
      className="inline-flex items-center justify-center rounded-full bg-sky-500/15 p-1 align-middle"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${sizeClasses[size]} text-sky-400`}
        aria-hidden="true"
      >
        <path d="M12 2.5L14.78 8.13L21 9.03L16.5 13.42L17.56 19.62L12 16.7L6.44 19.62L7.5 13.42L3 9.03L9.22 8.13L12 2.5Z" />
      </svg>
    </span>
  );
}
