"use client";

/**
 * Hook de compatibilidade de navegação espacial.
 * A navegação unificada por controle remoto (D-pad) e Smart TV é gerenciada
 * exclusivamente pelo componente central SpatialNavigation em RootLayout,
 * evitando listeners concorrentes que causavam avanço duplo (pular de 2 em 2).
 */
export function useSpatialNavigation() {
  // Centralizado em SpatialNavigation
}
