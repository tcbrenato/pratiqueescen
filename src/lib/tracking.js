// Récupère les paramètres UTM depuis l'URL
export function getUtmParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
  }
}

// Détecte le type d'appareil (mobile / desktop)
export function getDeviceType() {
  const ua = navigator.userAgent
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  return isMobile ? 'mobile' : 'desktop'
}

// Récupère la page d'origine (referrer)
export function getReferrer() {
  return document.referrer || 'direct'
}

// Regroupe toutes les données techniques en un seul appel
export function captureTechnicalData() {
  return {
    ...getUtmParams(),
    device_type: getDeviceType(),
    referrer: getReferrer(),
  }
}