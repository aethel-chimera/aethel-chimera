import { useMemo, useState } from 'react'
import { SERVICES, CONTACT, waLink } from '../data'

// ---------------------------------------------------------------------------
// BRIEFING — solicitação de orçamento, dentro da seção da Calculadora.
//
// O visitante marca os serviços, descreve a empresa e a ideia, e o formulário
// monta um briefing ESTRUTURADO destinado à aba de Solicitações do CRM.
// A expectativa orçamentária não é digitada do zero: vem do slider que a pessoa
// acabou de mexer logo acima (prop `invest`) — que é justamente o número que
// queremos analisar antes de responder.
//
// ROTA DE ENTREGA — trocar em um lugar só:
//   CRM_ENDPOINT = null  -> entrega pelo WhatsApp com o briefing já formatado
//                           (funciona hoje, sem backend nenhum).
//   CRM_ENDPOINT = 'url' -> passa a fazer POST do JSON direto para o CRM.
// Enquanto a base "Solicitações do Site" não existir no Notion (o workspace
// está no limite de blocos do plano gratuito), fica no modo WhatsApp: o
// briefing chega pronto para virar uma linha nova no CRM.
// ---------------------------------------------------------------------------
const CRM_ENDPOINT = null

const PRAZOS = ['O quanto antes', 'Até 30 dias', 'Até 90 dias', 'Sem pressa / planejando']
const ORIGENS = ['Indicação', 'Instagram', 'Google', 'Já é cliente', 'Outro']

const brl = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR')

const EMPTY = {
  empresa: '', responsavel: '', email: '', whatsapp: '',
  segmento: '', cidade: '', siteAtual: '',
  ideia: '', contexto: '', prazo: '', origem: '',
}

export default function BriefingRequest({ invest }) {
  const [form, setForm] = useState(EMPTY)
  const [servicos, setServicos] = useState([])
  const [enviado, setEnviado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleServico = (titulo) =>
    setServicos((s) => (s.includes(titulo) ? s.filter((x) => x !== titulo) : [...s, titulo]))

  // O briefing em texto — é exatamente este bloco que vira uma linha no CRM.
  const briefing = useMemo(() => {
    const L = []
    L.push('SOLICITAÇÃO DE ORÇAMENTO — via aethelchimera.com', '')
    L.push('Empresa: ' + (form.empresa || '—'))
    L.push('Responsável: ' + (form.responsavel || '—'))
    if (form.email) L.push('E-mail: ' + form.email)
    if (form.whatsapp) L.push('WhatsApp: ' + form.whatsapp)
    if (form.segmento) L.push('Segmento: ' + form.segmento)
    if (form.cidade) L.push('Cidade / UF: ' + form.cidade)
    if (form.siteAtual) L.push('Site ou perfil atual: ' + form.siteAtual)
    L.push('')
    L.push('Serviços desejados: ' + (servicos.length ? servicos.join(', ') : 'ainda não sei'))
    L.push('Investimento mensal previsto: ' + brl(invest))
    if (form.prazo) L.push('Prazo desejado: ' + form.prazo)
    if (form.origem) L.push('Como nos conheceu: ' + form.origem)
    if (form.ideia) L.push('', 'IDEIA DO PROJETO', form.ideia)
    if (form.contexto) L.push('', 'CONTEXTO E EXPECTATIVAS', form.contexto)
    return L.join('\n')
  }, [form, servicos, invest])

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.empresa.trim()) return setErro('Diga ao menos o nome da empresa.')
    if (!form.email.trim() && !form.whatsapp.trim())
      return setErro('Deixe um e-mail ou WhatsApp para podermos responder.')

    if (CRM_ENDPOINT) {
      try {
        await fetch(CRM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, servicos, investimento: invest, briefing }),
        })
        setEnviado(true)
      } catch {
        setErro('Não conseguimos enviar agora. Tente novamente ou chame no WhatsApp.')
      }
      return
    }
    // sem backend: abre o WhatsApp com o briefing inteiro já montado
    window.open(waLink(CONTACT.phones[0].e164, briefing), '_blank', 'noopener,noreferrer')
    setEnviado(true)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(briefing)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      setErro('O navegador bloqueou a cópia. Selecione o texto manualmente.')
    }
  }

  const campo =
    'w-full rounded-lg border border-ivory/15 bg-obsidian/60 px-3.5 py-3 text-ivory text-sm ' +
    'placeholder:text-titanium/40 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40 transition-colors'

  if (enviado) {
    return (
      <div className="relative rounded-2xl border border-signal/30 bg-obsidian-deep/70 p-8 md:p-12 text-center">
        <p className="mono-label text-signal mb-3">Briefing enviado</p>
        <h3 className="font-display font-semibold text-2xl md:text-3xl text-ivory mb-3">
          Recebemos sua solicitação.
        </h3>
        <p className="text-titanium max-w-md mx-auto leading-relaxed mb-7">
          Vamos analisar o escopo e a expectativa de investimento e responder pelo canal que você
          deixou. Se quiser adiantar, é só continuar a conversa no WhatsApp.
        </p>
        <button
          onClick={() => {
            setEnviado(false)
            setForm(EMPTY)
            setServicos([])
          }}
          className="mono-label text-titanium/70 hover:text-ivory transition-colors min-h-[44px]"
        >
          Enviar outra solicitação
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-2xl border border-ivory/12 bg-obsidian-deep/70 p-6 sm:p-8 md:p-10"
    >
      <span className="panel-tick" style={{ top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
      <span className="panel-tick" style={{ top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
      <span className="panel-tick" style={{ bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
      <span className="panel-tick" style={{ bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />

      <div className="flex items-center gap-3 mb-2">
        <span className="mono-label text-amber">Briefing</span>
        <span className="h-px flex-1 bg-gradient-to-r from-amber/60 via-violet/40 to-transparent" aria-hidden="true" />
      </div>
      <h3 className="font-display font-semibold text-[clamp(1.4rem,4.5vw,2.1rem)] text-ivory leading-tight mb-2">
        Peça seu orçamento
      </h3>
      <p className="text-titanium text-sm leading-relaxed mb-8 max-w-xl">
        Marque os serviços, conte a ideia e o que precisamos entender do seu negócio. O valor do
        slider acima vai junto como expectativa de investimento — é com ele que montamos a proposta.
      </p>

      {/* serviços desejados */}
      <fieldset className="mb-8">
        <legend className="mono-label text-titanium/60 mb-3">Serviços desejados</legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = servicos.includes(s.title)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleServico(s.title)}
                aria-pressed={on}
                className={`rounded-full border px-4 min-h-[44px] text-xs transition-colors ${
                  on
                    ? 'border-amber bg-amber/15 text-amber'
                    : 'border-ivory/15 text-titanium/75 hover:border-ivory/35 hover:text-ivory'
                }`}
              >
                {s.title}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* expectativa orçamentária — herdada do slider da calculadora */}
      <div className="mb-8 rounded-xl border border-amber/25 bg-amber/5 px-4 py-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="mono-label text-titanium/70">Investimento mensal previsto</span>
        <span className="font-display font-semibold text-xl text-amber tabular-nums">{brl(invest)}</span>
        <span className="font-mono text-[0.6rem] text-titanium/50">ajuste no slider acima</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="bf-empresa" className="mono-label text-titanium/60 block mb-2">Empresa *</label>
          <input id="bf-empresa" value={form.empresa} onChange={set('empresa')} className={campo} placeholder="Nome do negócio" required />
        </div>
        <div>
          <label htmlFor="bf-resp" className="mono-label text-titanium/60 block mb-2">Seu nome</label>
          <input id="bf-resp" value={form.responsavel} onChange={set('responsavel')} className={campo} placeholder="Quem fala com a gente" />
        </div>
        <div>
          <label htmlFor="bf-email" className="mono-label text-titanium/60 block mb-2">E-mail</label>
          <input id="bf-email" type="email" value={form.email} onChange={set('email')} className={campo} placeholder="voce@empresa.com" />
        </div>
        <div>
          <label htmlFor="bf-wpp" className="mono-label text-titanium/60 block mb-2">WhatsApp</label>
          <input id="bf-wpp" type="tel" value={form.whatsapp} onChange={set('whatsapp')} className={campo} placeholder="(31) 9 0000-0000" />
        </div>
        <div>
          <label htmlFor="bf-seg" className="mono-label text-titanium/60 block mb-2">Segmento</label>
          <input id="bf-seg" value={form.segmento} onChange={set('segmento')} className={campo} placeholder="Ex.: joalheria, clínica, restaurante" />
        </div>
        <div>
          <label htmlFor="bf-cid" className="mono-label text-titanium/60 block mb-2">Cidade / UF</label>
          <input id="bf-cid" value={form.cidade} onChange={set('cidade')} className={campo} placeholder="Itabira / MG" />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="bf-site" className="mono-label text-titanium/60 block mb-2">Site ou perfil atual</label>
        <input id="bf-site" value={form.siteAtual} onChange={set('siteAtual')} className={campo} placeholder="instagram.com/seu.perfil — ou deixe vazio se ainda não tem" />
      </div>

      <div className="mb-4">
        <label htmlFor="bf-ideia" className="mono-label text-titanium/60 block mb-2">Ideia do projeto</label>
        <textarea
          id="bf-ideia" value={form.ideia} onChange={set('ideia')} rows={4} maxLength={900}
          className={campo + ' resize-y'}
          placeholder="O que você quer construir? Descreva com as suas palavras."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="bf-ctx" className="mono-label text-titanium/60 block mb-2">
          O que mais precisamos entender
        </label>
        <textarea
          id="bf-ctx" value={form.contexto} onChange={set('contexto')} rows={4} maxLength={900}
          className={campo + ' resize-y'}
          placeholder="Público, concorrentes, o que já tentou, restrições — tudo que ajude a entender o pedido."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label htmlFor="bf-prazo" className="mono-label text-titanium/60 block mb-2">Prazo desejado</label>
          <select id="bf-prazo" value={form.prazo} onChange={set('prazo')} className={campo}>
            <option value="">Selecione</option>
            {PRAZOS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bf-origem" className="mono-label text-titanium/60 block mb-2">Como nos conheceu</label>
          <select id="bf-origem" value={form.origem} onChange={set('origem')} className={campo}>
            <option value="">Selecione</option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mb-5 text-sm text-amber border border-amber/30 bg-amber/10 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <button
          type="submit"
          className="rounded-full bg-ivory text-obsidian font-display font-semibold text-sm px-7 min-h-[48px] hover:bg-amber transition-colors"
        >
          Enviar solicitação
        </button>
        <button
          type="button"
          onClick={copiar}
          className="mono-label text-titanium/70 hover:text-ivory transition-colors min-h-[44px] px-2 text-left"
        >
          {copiado ? 'Briefing copiado' : 'Copiar briefing'}
        </button>
      </div>
      <p className="font-mono text-[0.62rem] text-titanium/45 mt-4 leading-relaxed">
        Vai direto para a nossa fila de análise. Usamos seus dados só para responder esta
        solicitação — nada de lista de disparo.
      </p>
    </form>
  )
}
