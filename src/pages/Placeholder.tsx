export default function Placeholder({ rotulo, titulo, texto }: { rotulo: string; titulo: string; texto: string }) {
  return (
    <main className="min-h-screen flex items-center px-6 py-16">
      <div className="max-w-md mx-auto">
        <p className="rotulo">{rotulo}</p>
        <h1 className="titulo-pagina mt-1">{titulo}</h1>
        <p className="mt-3 text-apoio leading-relaxed">{texto}</p>
      </div>
    </main>
  )
}
