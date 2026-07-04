export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-bg-main">
      {children}
    </div>
  );
}
