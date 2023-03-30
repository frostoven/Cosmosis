interface CosmDbgConfig {
  debugUiVisible?: boolean,
  uiState?: { [key: string]: any },
  tabScrollPosition?: { x: number; y: number },
  hookChooserState?: { [key: string]: any },
}

export {
  CosmDbgConfig,
}
