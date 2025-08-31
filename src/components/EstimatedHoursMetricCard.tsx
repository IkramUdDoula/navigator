import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricCardProps } from '@/types/gitlab';
import { cn } from '@/lib/utils';
import { Users, Clock, AlertTriangle } from 'lucide-react';

interface EstimatedHoursMetricCardProps extends Omit<MetricCardProps, 'primaryValue' | 'subtext'> {
  estimatedHours: number;
  capacityBreakdown: {
    totalTeamCapacity: number;
    dailyCapacity: number;
    utilizationPercentage: number;
    teamMemberCount: number;
    workingHoursPerDay: number;
  };
  sprintDays: number;
}

export function EstimatedHoursMetricCard({
  title,
  estimatedHours,
  capacityBreakdown,
  sprintDays,
  className
}: EstimatedHoursMetricCardProps) {
  const getUtilizationStatus = (utilization: number): 'good' | 'poor' | 'neutral' => {
    if (utilization > 100) return 'poor';
    if (utilization > 80) return 'neutral';
    return 'good';
  };

  const getStatusColors = (status: 'good' | 'poor' | 'neutral') => {
    switch (status) {
      case 'good':
        return { cardClass: 'border-green-200 bg-green-50 dark:bg-green-900/20', badgeClass: 'bg-green-100 text-green-800' };
      case 'poor':
        return { cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20', badgeClass: 'bg-red-100 text-red-800' };
      default:
        return { cardClass: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20', badgeClass: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const utilizationStatus = getUtilizationStatus(capacityBreakdown.utilizationPercentage);
  const statusColors = getStatusColors(utilizationStatus);
  
  // Calculate values
  const totalCapacity = capacityBreakdown.teamMemberCount * sprintDays * capacityBreakdown.workingHoursPerDay;
  const dailyBandwidth = capacityBreakdown.teamMemberCount * capacityBreakdown.workingHoursPerDay;
  const availableCapacity = Math.max(0, totalCapacity - estimatedHours);
  const utilization = totalCapacity > 0 ? (estimatedHours / totalCapacity) * 100 : 0;

  // One-liner text
  const oneLineSummary = `Team of ${capacityBreakdown.teamMemberCount} → ${sprintDays} working days × ${capacityBreakdown.workingHoursPerDay}h = ${totalCapacity}h total, ${dailyBandwidth}h/day, ${Math.round(estimatedHours)}h estimated (${Math.round(utilization * 10) / 10}% utilization), ${availableCapacity}h free`;

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md hover:scale-105', statusColors.cardClass, className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
          </h3>
          {utilizationStatus !== 'good' && (
            <Badge variant="outline" className={cn('text-xs', statusColors.badgeClass)}>
              {utilizationStatus === 'poor' ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overallocated
                </>
              ) : (
                'High Load'
              )}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Main Estimated Hours Display */}
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tight">
              {Math.round(estimatedHours * 10) / 10}h
            </div>
            <p className="text-sm text-muted-foreground">Total estimation</p>
          </div>

          {/* Sprint Capacity Breakdown */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Sprint Capacity Breakdown
            </div>
            
            <div className="space-y-2">
              {/* Capacity Formula */}
              <div className="text-sm">
                <span className="text-muted-foreground">Total Capacity: </span>
                <span className="font-medium">
                  Team Size × {sprintDays} days × {capacityBreakdown.workingHoursPerDay}h = {totalCapacity}h
                </span>
              </div>
              
              {/* Daily Bandwidth */}
              <div className="text-sm">
                <span className="text-muted-foreground">Daily Bandwidth: </span>
                <span className="font-medium">{dailyBandwidth}h/day</span>
              </div>
              
              {/* Utilization */}
              <div className="text-sm">
                <span className="text-muted-foreground">Utilization: </span>
                <span className={cn('font-medium', {
                  'text-green-600': utilizationStatus === 'good',
                  'text-yellow-600': utilizationStatus === 'neutral',
                  'text-red-600': utilizationStatus === 'poor'
                })}>
                  {Math.round(utilization * 10) / 10}%
                </span>
              </div>
              
              {/* Available Capacity */}
              <div className="text-sm">
                <span className="text-muted-foreground">Available Capacity: </span>
                <span className="font-medium">{availableCapacity}h remaining</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <Progress 
                  value={Math.min(utilization, 100)} 
                  className={cn('h-2', {
                    '[&>div]:bg-green-500': utilizationStatus === 'good',
                    '[&>div]:bg-yellow-500': utilizationStatus === 'neutral',
                    '[&>div]:bg-red-500': utilizationStatus === 'poor'
                  })}
                />
              </div>

              {/* One-liner Summary */}
              <div className="mt-4 p-3 rounded-md bg-muted/50">
                <div className="text-xs text-muted-foreground font-mono leading-relaxed">
                  <strong>Summary:</strong><br/>
                  {oneLineSummary}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}