import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const configurado = !!supabaseUrl && !!supabaseAnonKey

if (!configurado) {
  console.warn(
    '[supabase] Variáveis de ambiente ausentes. Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example). Rodando sem conexão real com o Supabase — isso só é um problema se DEMO_MODE estiver desligado em src/lib/auth.tsx.'
  )
}

// Usa um placeholder válido (mas inerte) quando o .env não está configurado,
// para o createClient nunca lançar exceção e travar a aplicação inteira antes
// do React conseguir renderizar (isso causava a tela branca no app empacotado).
export const supabase = createClient(
  configurado ? (supabaseUrl as string) : 'https://placeholder.supabase.co',
  configurado ? (supabaseAnonKey as string) : 'placeholder-anon-key'
)

export const supabaseConfigurado = configurado
