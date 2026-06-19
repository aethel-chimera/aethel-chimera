// Cabeçalho de seção unificado — a "gramática de console" do Active Theory
// aplicada a toda a página: índice técnico SEC 0X, linha-guia, kicker em mono
// e o título display com destaque em serif âmbar. Dá ritmo coeso ao site.
export default function SectionHead({ index, kicker, title, accent, align = 'left', className = '' }) {
  return (
    <header className={`relative ${align === 'center' ? 'text-center' : ''} ${className}`}>
      {/* régua técnica: [ SEC 0X ] ———— kicker */}
      <div className={`flex items-center gap-4 mb-6 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="mono-label text-amber whitespace-nowrap">[ SEC {index} ]</span>
        <span className="h-px w-12 md:w-24 bg-ivory/15" aria-hidden="true" />
        {kicker && <span className="mono-label text-titanium/60 whitespace-nowrap">{kicker}</span>}
      </div>

      {title && (
        <h2 className="font-display font-semibold uppercase tracking-tightest text-[clamp(2rem,5.5vw,4.5rem)] text-ivory leading-[0.95]">
          {title}{' '}
          {accent && (
            <span className="font-serif italic normal-case text-amber tracking-normal">{accent}</span>
          )}
        </h2>
      )}
    </header>
  )
}
