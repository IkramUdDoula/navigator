import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricCardProps } from '@/types/gitlab';
import { cn } from '@/lib/utils';
import { Users, Clock, Target } from 'lucide-react';

interface VelocityMetricCardProps extends Omit<MetricCardProps, 'primaryValue' | 'subtext'> {
  achievedVelocity: number;
  requiredVelocity: number;
  capacityBreakdown?: {
    totalTeamCapacity: number;
    dailyCapacity: number;
    utilizationPercentage: number;
    teamMemberCount: number;
    workingHoursPerDay: number;
  };
}

export function VelocityMetricCard({
  title,
  achievedVelocity,
  requiredVelocity,
  statusIndicator,
  capacityBreakdown,
  className
}: VelocityMetricCardProps) {
  const getStatusColors = (status: 'good' | 'poor' | 'neutral') => {
    switch (status) {
      case 'good':
        return { cardClass: 'border-green-200 bg-green-50 dark:bg-green-900/20', badgeClass: 'bg-green-100 text-green-800' };
      case 'poor':
        return { cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20', badgeClass: 'bg-red-100 text-red-800' };
      default:
        return { cardClass: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20', badgeClass: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusColors = statusIndicator ? getStatusColors(statusIndicator) : null;
  const formatVelocity = (velocity: number) => `${Math.round(velocity * 10) / 10} issues/day`;

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md hover:scale-105', statusColors?.cardClass, className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            {title}
          </h3>
          {statusIndicator && (
            <Badge variant="outline" className={cn('text-xs', statusColors?.badgeClass)}>
              {statusIndicator === 'good' ? 'On Track' : statusIndicator === 'poor' ? 'Behind' : 'Info'}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatVelocity(achievedVelocity)}</div>
              <div className="text-xs text-muted-foreground">Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatVelocity(requiredVelocity)}</div>
              <div className="text-xs text-muted-foreground">Required</div>
            </div>
          </div>

          {capacityBreakdown && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Sprint Capacity
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team Capacity:</span>
                  <span className="font-medium">{capacityBreakdown.totalTeamCapacity}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />Daily Bandwidth:
                  </span>
                  <span className="font-medium">{capacityBreakdown.dailyCapacity}h/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team:</span>
                  <span className="font-medium">
                    {capacityBreakdown.teamMemberCount} × {capacityBreakdown.workingHoursPerDay}h
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilization:</span>
                    <span className="font-medium text-blue-600">{capacityBreakdown.utilizationPercentage}%</span>
                  </div>
                  <Progress value={Math.min(capacityBreakdown.utilizationPercentage, 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    {capacityBreakdown.utilizationPercentage > 100 ? 'Overallocated' : 
                     capacityBreakdown.utilizationPercentage > 80 ? 'High utilization' : 'Healthy capacity'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}