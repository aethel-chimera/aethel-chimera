import SectionHead from './SectionHead'
import CatalogCard from './CatalogCard'
import { CATALOG } from '../data'

const COLUMNS_LG = 3 // cards da mesma linha entram em cascata

export default function Catalog({ onOpenProject, reducedMotion }) {
  return (
    <section id="catalogo" className="relative z-[3] px-page py-20 md:py-32">
      <div className="w-full">
        <SectionHead index="04" kicker="Portfólio" title="Projetos" accent="no ar" className="mb-12 md:mb-16" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {CATALOG.map((project, i) => (
            <CatalogCard
              key={project.slug}
              project={project}
              index={i}
              order={i % COLUMNS_LG}
              reducedMotion={reducedMotion}
              onOpen={onOpenProject}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
