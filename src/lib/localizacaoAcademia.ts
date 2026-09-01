// ============================================================
// Localização da academia — usada para validar o check-in do aluno.
// ------------------------------------------------------------
// IMPORTANTE: troque LATITUDE/LONGITUDE pelas coordenadas reais do
// endereço da Gracie Barra Garopaba antes de usar em produção. Pra
// pegar essas coordenadas: abra o endereço no Google Maps, clique
// com o botão direito no pino exato da academia e copie os números
// que aparecem no topo do menu (ex: -28.0273, -48.6172).
// ============================================================
export const ACADEMIA_LATITUDE = -28.0273
export const ACADEMIA_LONGITUDE = -48.6172

/** Raio em metros a partir do ponto acima que conta como "estar na academia". */
export const RAIO_PERMITIDO_METROS = 150

/** Distância em metros entre duas coordenadas (fórmula de Haversine). */
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const rad = (graus: number) => (graus * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function validarLocalizacao(lat: number, lng: number) {
  const distancia = Math.round(distanciaMetros(lat, lng, ACADEMIA_LATITUDE, ACADEMIA_LONGITUDE))
  return { valido: distancia <= RAIO_PERMITIDO_METROS, distancia }
}
