import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  it('should render basic metric card with title and value', () => {
    render(
      <MetricCard
        title="Test Metric"
        primaryValue="42"
        subtext="Test description"
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render metric card with good status indicator', () => {
    render(
      <MetricCard
        title="Completion Rate"
        primaryValue="85%"
        subtext="Percent completed"
        statusIndicator="good"
      />
    );

    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('should render metric card with poor status indicator', () => {
    render(
      <MetricCard
        title="Velocity"
        primaryValue="1.2"
        subtext="Issues per day"
        statusIndicator="poor"
      />
    );

    expect(screen.getByText('Behind')).toBeInTheDocument();
  });

  it('should render metric card with neutral status indicator', () => {
    render(
      <MetricCard
        title="Total Issues"
        primaryValue="97"
        subtext="All issues"
        statusIndicator="neutral"
      />
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should render comparison value when provided', () => {
    render(
      <MetricCard
        title="Estimated Hours"
        primaryValue="617h"
        subtext="Total estimation"
        comparisonValue="75% of sprint capacity"
      />
    );

    expect(screen.getByText('617h')).toBeInTheDocument();
    expect(screen.getByText('75% of sprint capacity')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for good status', () => {
    render(
      <MetricCard
        title="Test"
        primaryValue="100"
        subtext="Description"
        statusIndicator="good"
      />
    );

    const card = screen.getByRole('card');
    expect(card).toHaveClass('border-green-200', 'bg-green-50');
  });

  it('should apply correct CSS classes for poor status', () => {
    render(
      <MetricCard
        title="Test"
        primaryValue="100"
        subtext="Description"
        statusIndicator="poor"
      />
    );

    const card = screen.getByRole('card');
    expect(card).toHaveClass('border-red-200', 'bg-red-50');
  });

  it('should apply correct CSS classes for neutral status', () => {
    render(
      <MetricCard
        title="Test"
        primaryValue="100"
        subtext="Description"
        statusIndicator="neutral"
      />
    );

    const card = screen.getByRole('card');
    expect(card).toHaveClass('border-blue-200', 'bg-blue-50');
  });

  it('should render without status indicator when not provided', () => {
    render(
      <MetricCard
        title="Test"
        primaryValue="100"
        subtext="Description"
      />
    );

    expect(screen.queryByText('On Track')).not.toBeInTheDocument();
    expect(screen.queryByText('Behind')).not.toBeInTheDocument();
    expect(screen.queryByText('Info')).not.toBeInTheDocument();
  });

  it('should handle numeric primary values', () => {
    render(
      <MetricCard
        title="Total Issues"
        primaryValue={97}
        subtext="All issues planned"
      />
    );

    expect(screen.getByText('97')).toBeInTheDocument();
  });

  it('should include proper test ids for testing', () => {
    render(
      <MetricCard
        title="Completion Rate"
        primaryValue="75%"
        subtext="Percent completed"
        statusIndicator="good"
      />
    );

    expect(screen.getByTestId('metric-card-completion-rate')).toBeInTheDocument();
    expect(screen.getByTestId('completion-rate-status')).toBeInTheDocument();
  });
});