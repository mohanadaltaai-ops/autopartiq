import { DEFAULT_MARKET, MARKETS } from '../config/markets';

export function getMarketCode() {
  const raw = import.meta.env.VITE_MARKET || DEFAULT_MARKET;
  const code = String(raw).trim().toUpperCase();
  return MARKETS[code] ? code : DEFAULT_MARKET;
}

export function getMarketConfig() {
  return MARKETS[getMarketCode()];
}

export function getMarketAppName(language = 'en') {
  const market = getMarketConfig();
  return market.appName?.[language] || market.appName?.en || 'PartLink IQ';
}

export function getMarketCountryName(language = 'en') {
  const market = getMarketConfig();
  return market.countryName?.[language] || market.countryName?.en || 'Iraq';
}

export function getMarketCurrency() {
  return getMarketConfig().currency;
}

export function getMarketPhonePrefix() {
  return getMarketConfig().phonePrefix;
}

export function getMarketSupportEmail() {
  return getMarketConfig().supportEmail;
}

export function getMarketCities() {
  return getMarketConfig().cities || [];
}

export function marketFeatureEnabled(featureName) {
  return Boolean(getMarketConfig().features?.[featureName]);
}

export function formatMarketMoney(value) {
  return `${Number(value || 0).toLocaleString()} ${getMarketCurrency()}`;
}
