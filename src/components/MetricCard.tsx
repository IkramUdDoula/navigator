import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCardProps } from '@/types/gitlab';
import { cn } from '@/lib/utils';

export function MetricCard({
  title,
  primaryValue,
  subtext,
  statusIndicator,
  comparisonValue,
  className
}: MetricCardProps) {
  const getStatusColors = (status: 'good' | 'poor' | 'neutral') => {
    switch (status) {
      case 'good':
        return {
          cardClass: 'border-green-200 bg-green-50 dark:bg-green-900/20',
          badgeClass: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'poor':
        return {
          cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20',
          badgeClass: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'neutral':
      default:
        return {
          cardClass: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const statusColors = statusIndicator ? getStatusColors(statusIndicator) : null;

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md hover:scale-105',
        statusColors?.cardClass,
        className
      )}
      role="card"
      data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            <div className="space-y-1">
              <div className="text-3xl font-bold tracking-tight">
                {primaryValue}
              </div>
              <p className="text-sm text-muted-foreground">
                {subtext}
              </p>
              {comparisonValue && (
                <p className="text-xs text-muted-foreground">
                  {comparisonValue}
                </p>
              )}
            </div>
          </div>
          
          {statusIndicator && (
            <Badge 
              variant="outline"
              className={cn(
                'ml-2 text-xs',
                statusColors?.badgeClass
              )}
              data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-status`}
            >
              {statusIndicator === 'good' ? 'On Track' : 
               statusIndicator === 'poor' ? 'Behind' : 'Info'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}