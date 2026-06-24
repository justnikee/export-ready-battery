export function MetaBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-[#c3c4c7] bg-white">
      <h3 className="border-b border-[#c3c4c7] px-3 py-2 text-sm font-semibold text-[#1d2327]">
        {title}
      </h3>
      <div className="p-3 space-y-3">{children}</div>
    </div>
  );
}
