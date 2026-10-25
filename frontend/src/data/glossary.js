// Glossary of UK Wholesale Electricity and Wind Power Forecasting Terms
// Plain English definitions and examples for beginners

export const GLOSSARY_TERMS = {
  'D-1 auction': {
    term: 'D-1 auction',
    plainDefinition: 'The day-ahead power auction where buyers and sellers trade electricity for each hour of tomorrow before gate closure.',
    example: 'A utility enters the D-1 auction at 11:00 UTC to buy 400 MW for tomorrow morning at 08:00.'
  },
  'cashout': {
    term: 'Cashout (Imbalance Price)',
    plainDefinition: 'The expensive penalty price charged by the grid operator if you buy less power than your consumers actually end up using.',
    example: 'Missing 100 MW of wind output during peak hours triggers a £150/MWh penalty on the balancing market.'
  },
  'P90': {
    term: 'P90 (90% Confidence Deficit)',
    plainDefinition: 'A cautious safety margin sized so that on 9 days out of 10, the real shortfall won’t be worse than this number.',
    example: 'Holding a +4,312 MW buffer covers 90% of all wind forecast deficit errors across the month.'
  },
  'MAE': {
    term: 'MAE (Mean Absolute Error)',
    plainDefinition: 'The typical size of the forecast miss in either direction, ignoring whether it was too high or too low.',
    example: 'An MAE of 1,110 MW means each hourly forecast was off by about 1,110 MW on average.'
  },
  'WAPE': {
    term: 'WAPE (Weighted Absolute % Error)',
    plainDefinition: 'The total forecast miss divided by total wind generation, giving a fair percentage score that is not distorted by tiny numbers.',
    example: 'A 18.3% WAPE means roughly 18% of the total monthly wind volume was misjudged.'
  },
  'RMSE': {
    term: 'RMSE (Root Mean Squared Error)',
    plainDefinition: 'An error metric that penalizes severe, dangerous forecast blunders much more heavily than small misses.',
    example: 'RMSE rises quickly when a sudden front causes a 5,000 MW unexpected collapse in wind.'
  },
  'BMRS': {
    term: 'BMRS (Balancing Mechanism Reporting Service)',
    plainDefinition: 'The official UK Elexon portal that publishes real-time electricity generation, demand, and market data.',
    example: 'National Grid ESO and Elexon publish metered fuel data every 30 minutes on BMRS.'
  },
  'Settlement Period': {
    term: 'Settlement Period (SP)',
    plainDefinition: 'A 30-minute block used in the UK electricity market to measure generation and balance accounts (48 SPs per day).',
    example: 'SP 1 runs from 00:00 to 00:30 GMT; SP 17 & 18 cover delivery hour 08:00–09:00.'
  },
  'Thermal': {
    term: 'Thermal Generation',
    plainDefinition: 'Dispatchable power stations (such as gas-fired CCGT or biomass) that can be turned on when wind fails.',
    example: 'When wind is 2,000 MW lower than predicted, gas turbines are fired up to keep the lights on.'
  },
  'Buffer': {
    term: 'Safety Buffer',
    plainDefinition: 'Extra backup electricity bought a day ahead to absorb forecast errors before they turn into expensive penalties.',
    example: 'Adding a 2,500 MW safety buffer reduces the risk of unhedged power shortages to under 10%.'
  },
  'Curtailment': {
    term: 'Curtailment',
    plainDefinition: 'When wind turbines are deliberately ordered to switch off because the local transmission wires are full.',
    example: 'Scottish wind farms producing 3,000 MW are curtailed when cables south across the border are congested.'
  },
  'Over-forecast': {
    term: 'Over-forecast (Deficit Risk)',
    plainDefinition: 'When meteorologists predict more wind than actually arrives, leaving power buyers short of energy.',
    example: 'Forecasting 15,000 MW when only 12,000 MW arrives creates a 3,000 MW deficit that must be covered.'
  }
};
