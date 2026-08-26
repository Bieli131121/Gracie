export function SemAcesso() {
  return (
    <div className="p-8">
      <div className="bg-white border border-mat-700/10 rounded-sm p-8 max-w-md">
        <h1 className="font-display text-lg text-mat-900 mb-2">Sem acesso</h1>
        <p className="text-sm text-mat-700/60">
          Seu usuário não tem permissão para acessar esta área. Fale com um administrador.
        </p>
      </div>
    </div>
  )
}
