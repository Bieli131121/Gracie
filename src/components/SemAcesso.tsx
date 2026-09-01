export function SemAcesso() {
  return (
    <div className="p-8">
      <div className="bg-surface border border-border rounded p-8 max-w-md">
        <h1 className="font-display text-lg text-content-primary mb-2">Sem acesso</h1>
        <p className="text-sm text-content-secondary">
          Seu usuário não tem permissão para acessar esta área. Fale com um administrador.
        </p>
      </div>
    </div>
  )
}
