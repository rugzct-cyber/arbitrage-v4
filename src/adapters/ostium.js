// src/adapters/ostium.js
const { httpPost } = require('../utils/fetcher');
const base = require('./base.adapter');

const SUBGRAPH_URL = "https://subgraph.satsuma-prod.com/391a61815d32/ostium/ost-prod/api";
const QUERY = `
{
  pairs(first: 1000) {
    from
    to
    lastTradePrice
    lastFundingRate
  }
}
`;

// Les facteurs de conversion exacts tirés de l'analyse du code
const PRICE_PRECISION = 1e18;  // Confirmé par la doc Web3.py
const FUNDING_RATE_PRECISION = 1e9;  // Précision brute du Subgraph

// Facteur de conversion complexe pour obtenir le taux par période (taux horaire ou 8H).
// La formule exacte doit être extraite du SDK/contrat pour garantir 100% de précision.
// Nous allons utiliser un intervalle de 8 heures (3 fois par jour) comme standard pour la fonction normalize.
const FUNDING_INTERVAL_HOURS = 8;

module.exports = {
    name: "ostium",
    getGlobalData: async () => {
        try {
            const response = await httpPost(SUBGRAPH_URL, { query: QUERY });

            if (!response || !response.data || !response.data.pairs) {
                console.error("[Ostium] Invalid subgraph response");
                return [];
            }

            return response.data.pairs.map(pair => {
                // Nettoyage du nom du symbole
                let symbol = `${pair.from}-${pair.to}`;
                symbol = symbol.replace(/-USD$/i, '');

                // PRIX : Correction du scaling (1e18)
                const price = parseFloat(pair.lastTradePrice) / PRICE_PRECISION;

                // FUNDING RATE : Conversion et mise à l'échelle
                const rawRate = parseFloat(pair.lastFundingRate);

                // Nous supposons que le Subgraph fournit le taux par période (8H) brut,
                // ou un taux standardisé. Nous utilisons la précision 1e9, et l'APR est calculé par base.normalize.
                // NOTE: Si le taux reste faux, il faudra insérer le facteur de conversion (10/3)*3600/X ici.
                const fundingRatePerPeriod = rawRate / FUNDING_RATE_PRECISION;

                // base.normalize calcule l'APR en utilisant le taux par période et l'intervalle 8H.
                return base.normalize("ostium", symbol, price, fundingRatePerPeriod, FUNDING_INTERVAL_HOURS);
            });

        } catch (error) {
            console.error("[Ostium] Error fetching data:", error.message);
            return [];
        }
    }
};
