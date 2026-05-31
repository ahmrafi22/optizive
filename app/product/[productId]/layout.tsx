export default async function PublicProductLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}) {
  return (
    <div className="min-h-screen bg-(--clr-surface) text-(--clr-fg)">
      <header className="sticky top-0 z-50 flex items-center justify-center border-b border-(--clr-border) bg-(--clr-surface)/80 backdrop-blur-md px-4 sm:px-6 h-14">
        <span className="font-naston text-lg font-bold tracking-wide text-(--clr-fg)">
          OPTIZIVE
        </span>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        {children}
      </main>
    </div>
  );
}
