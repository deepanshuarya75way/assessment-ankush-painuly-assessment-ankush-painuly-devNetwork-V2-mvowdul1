export default function UserAvatar({ user, size = "md" }) {
  const sizeClasses = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "?";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || "User avatar"}
        className={`${sizeClasses[size]} rounded-2xl object-cover border border-dark-400 bg-dark-700`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl border border-dark-400 bg-dark-600 text-slate-200 flex items-center justify-center font-semibold`}
    >
      {initials}
    </div>
  );
}
