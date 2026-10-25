import React, { useState } from 'react';
import { Download, ExternalLink, ArrowUpDown } from 'lucide-react';

export default function DailyTable({ dailySummaries, onSelectDate }) {
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  if (!dailySummaries || dailySummaries.length === 0) return null;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...dailySummaries].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const exportCSV = () => {
    const headers = [
      'Date',
      'Actual_MWh',
      'Forecast_MWh',
      'MAE_MW',
      'Bias_MW',
      'RMSE_MW',
      'WAPE_Percent',
      'Max_Overforecast_MW',
      'Max_Underforecast_MW',
      'Dominant_Risk'
    ];
    const rows = sortedData.map((d) => [
      d.date,
      d.actualMWh,
      d.forecastMWh,
      d.maeMW,
      d.biasMW,
      d.rmseMW,
      d.wapePercent,
      d.maxOverForecastMW,
      d.maxUnderForecastMW,
      `"${d.dominantRisk}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'uk_wind_day_ahead_jan2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-card glass-panel">
      <div className="table-header-row">
        <div>
          <div className="chart-tag">PERFORMANCE MATRIX</div>
          <h3 className="section-title">January 2026 Daily Evaluation Matrix</h3>
          <p className="section-desc">
            Complete settlement audit of all 31 delivery days in January 2026. Click any column header to sort.
          </p>
        </div>
        <button className="btn-export" onClick={exportCSV}>
          <Download size={16} />
          Export Dataset (CSV)
        </button>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('actualMWh')} className="sortable">
                Actual (MWh) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('forecastMWh')} className="sortable">
                Forecast (MWh) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('maeMW')} className="sortable">
                MAE (MW) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('biasMW')} className="sortable">
                Bias (MW) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('rmseMW')} className="sortable">
                RMSE (MW) <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('wapePercent')} className="sortable">
                WAPE <ArrowUpDown size={12} />
              </th>
              <th>Max Over-forecast</th>
              <th>Dominant Imbalance Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((day) => {
              const isOver = day.biasMW > 500;
              const isUnder = day.biasMW < -500;
              return (
                <tr key={day.date}>
                  <td className="font-mono font-bold text-white">
                    {day.date}
                  </td>
                  <td className="font-mono text-green">
                    {day.actualMWh.toLocaleString()}
                  </td>
                  <td className="font-mono text-purple">
                    {day.forecastMWh.toLocaleString()}
                  </td>
                  <td className="font-mono font-semibold text-cyan">
                    {day.maeMW.toLocaleString()}
                  </td>
                  <td className="font-mono font-semibold">
                    <span className={day.biasMW >= 0 ? 'text-rose' : 'text-amber'}>
                      {day.biasMW >= 0 ? `+${day.biasMW.toLocaleString()}` : day.biasMW.toLocaleString()}
                    </span>
                  </td>
                  <td className="font-mono text-muted">
                    {day.rmseMW.toLocaleString()}
                  </td>
                  <td className="font-mono">
                    {day.wapePercent}%
                  </td>
                  <td className="font-mono text-rose">
                    +{day.maxOverForecastMW.toLocaleString()} MW
                  </td>
                  <td>
                    <span className={`badge-risk ${isOver ? 'risk-high' : isUnder ? 'risk-surplus' : 'risk-balanced'}`}>
                      {day.dominantRisk}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-inspect"
                      onClick={() => onSelectDate(day.date)}
                      title="Inspect day-ahead curve for this date"
                    >
                      <ExternalLink size={14} />
                      Inspect Day
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
