import React from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart,
  ScatterChart,
  LineChart,
  BillboardChart,
  BarChart,
  HeatmapChart,
  HistogramChart,
  PieChart,
  FunnelChart,
  TableChart,
} from 'nr1';

const chart = ({ title, accountId, query, type, data, click }) => {
  const renderChart = () => {
    switch (type) {
      case 'area':
        return query ? (
          <AreaChart accountId={accountId} query={query} />
        ) : (
          <AreaChart data={data} />
        );
      case 'bar':
        return query ? (
          <BarChart accountId={accountId} query={query} />
        ) : (
          <BarChart data={data} />
        );
      case 'billboard':
        return query ? (
          <BillboardChart accountId={accountId} query={query} />
        ) : (
          <BillboardChart data={data} />
        );
      case 'heatmap':
        return query ? (
          <HeatmapChart accountId={accountId} query={query} />
        ) : (
          <HeatmapChart data={data} />
        );
      case 'histogram':
        return query ? (
          <HistogramChart accountId={accountId} query={query} />
        ) : (
          <HistogramChart data={data} />
        );
      case 'pie':
        return query ? (
          <PieChart accountId={accountId} query={query} />
        ) : (
          <PieChart data={data} />
        );
      case 'funnel':
        return query ? (
          <FunnelChart accountId={accountId} query={query} />
        ) : (
          <FunnelChart data={data} />
        );
      case 'scatter':
        return query ? (
          <ScatterChart accountId={accountId} query={query} />
        ) : (
          <ScatterChart data={data} />
        );
      case 'table':
        return query ? (
          <TableChart
            accountId={accountId}
            query={query}
            onClickTable={click}
          />
        ) : (
          <TableChart data={data} onClickTable={click} />
        );
      default:
        return query ? (
          <LineChart accountId={accountId} query={query} />
        ) : (
          <LineChart data={data} />
        );
    }
  };

  return (
    <div className="chart__container">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
      </div>
      <div className="chart-content">{renderChart()}</div>
    </div>
  );
};

chart.propTypes = {
  title: PropTypes.string.isRequired,
  accountId: PropTypes.number,
  query: PropTypes.string,
  type: PropTypes.string,
  data: PropTypes.array,
  click: PropTypes.func,
};

export default chart;
