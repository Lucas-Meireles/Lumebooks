export default function DashboardLayout({ sidebar, children }) {
  return (
    <main className="catalog-home">
      <aside className="catalog-sidebar">
        {sidebar}
      </aside>

      <section className="catalog-main">
        {children}
      </section>
    </main>
  )
}