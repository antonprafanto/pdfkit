/**
 * Loading Skeleton Components
 * Placeholder components shown while content is loading
 */

import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animate?: boolean;
}

// Base skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  animate = true,
}) => (
  <div
    className={`skeleton ${animate ? 'skeleton--animate' : ''} ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    }}
  />
);

// Text line skeleton
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`skeleton-text ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={14}
        width={i === lines - 1 ? '70%' : '100%'}
        className="skeleton-text__line"
      />
    ))}
  </div>
);

// Avatar skeleton
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius="50%"
    className={`skeleton-avatar ${className}`}
  />
);

// Button skeleton
export const SkeletonButton: React.FC<{ width?: number; className?: string }> = ({
  width = 100,
  className = '',
}) => (
  <Skeleton
    width={width}
    height={36}
    borderRadius={6}
    className={`skeleton-button ${className}`}
  />
);

// Card skeleton
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton height={120} borderRadius="8px 8px 0 0" />
    <div className="skeleton-card__content">
      <Skeleton width="60%" height={18} />
      <SkeletonText lines={2} />
    </div>
  </div>
);

// PDF page skeleton
export const SkeletonPDFPage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-pdf-page ${className}`}>
    <Skeleton height="100%" borderRadius={4} />
    <div className="skeleton-pdf-page__lines">
      <SkeletonText lines={8} />
    </div>
  </div>
);

// Sidebar item skeleton
export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-list-item ${className}`}>
    <SkeletonAvatar size={32} />
    <div className="skeleton-list-item__content">
      <Skeleton width="70%" height={14} />
      <Skeleton width="40%" height={12} />
    </div>
  </div>
);

// Table row skeleton
export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 4,
  className = '',
}) => (
  <div className={`skeleton-table-row ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} width={`${90 - i * 10}%`} height={16} />
    ))}
  </div>
);

// Toolbar skeleton
export const SkeletonToolbar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-toolbar ${className}`}>
    <div className="skeleton-toolbar__group">
      <SkeletonButton width={80} />
      <SkeletonButton width={80} />
      <SkeletonButton width={80} />
    </div>
    <div className="skeleton-toolbar__group">
      <SkeletonButton width={120} />
    </div>
  </div>
);

export default Skeleton;
