import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = forwardRef(({ config }, ref) => {
  const chartRef = useRef(null);

  // Expose method to get canvas element to parent via ref
  useImperativeHandle(ref, () => ({
    getCanvas: () => chartRef.current?.canvas,
  }));

  const chartProps = {
    ref: chartRef,
    data: config.data,
    options: {
      ...config.options,
      maintainAspectRatio: false,
      responsive: true,
    },
  };

  const renderChart = () => {
    switch (config.type.toLowerCase()) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  return (
    <div style={{ width: '100%', height: '300px', marginTop: 10 }}>
      {renderChart()}
    </div>
  );
});

export default ChartComponent;