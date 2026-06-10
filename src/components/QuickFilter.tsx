import { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  QuickFilterState,
  DEFAULT_QUICK_FILTER,
  ProblemType,
  PROBLEM_TYPE_LABEL,
  CustomerLevel,
  CUSTOMER_LEVEL_LABEL,
} from '@/types';

interface Props {
  filter: QuickFilterState;
  onChange: (filter: QuickFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function QuickFilter({ filter, onChange, totalCount, filteredCount }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilter =
    filter.problemType !== null ||
    filter.customerLevel !== null ||
    filter.isHighPriority !== null;

  const clearAll = () => {
    onChange({ ...DEFAULT_QUICK_FILTER });
  };

  const toggleProblemType = (type: ProblemType) => {
    onChange({
      ...filter,
      problemType: filter.problemType === type ? null : type,
    });
  };

  const toggleCustomerLevel = (level: CustomerLevel) => {
    onChange({
      ...filter,
      customerLevel: filter.customerLevel === level ? null : level,
    });
  };

  const toggleHighPriority = () => {
    onChange({
      ...filter,
      isHighPriority: filter.isHighPriority === null ? true : filter.isHighPriority ? null : false,
    });
  };

  const activeFilterCount = [
    filter.problemType,
    filter.customerLevel,
    filter.isHighPriority !== null,
  ].filter(Boolean).length;

  return (
    <div className="mb-2 sm:mb-3">
      <div className="flex items-center justify-between mb-2">
        <button
          className="flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2 -mx-2 rounded-md hover:bg-white/5 active:bg-white/10"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>快捷筛选</span>
          {activeFilterCount > 0 && (
            <span className="chip bg-accent-cyan/20 text-accent-cyan text-[10px] px-1.5 py-0 min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          )}
        </button>

        {hasActiveFilter && (
          <button
            className="flex items-center gap-1 text-xs sm:text-[11px] text-accent-orange hover:text-accent-orange/80 transition-colors py-1.5 px-2 -mr-2 rounded-md hover:bg-accent-orange/10 active:bg-accent-orange/20"
            onClick={clearAll}
          >
            <X className="w-4 h-4 sm:w-3 sm:h-3" /> 清除筛选
          </button>
        )}
      </div>

      {hasActiveFilter && (
        <div className="text-[11px] sm:text-xs text-text-secondary/70 mb-2">
          显示 <span className="text-accent-cyan font-mono">{filteredCount}</span> /{' '}
          <span className="font-mono">{totalCount}</span> 条
        </div>
      )}

      {expanded && (
        <div className="space-y-3 p-2.5 sm:p-3 bg-white/3 rounded-lg border border-white/5 animate-fade-in">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 sm:w-3 sm:h-3" /> 问题类型
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Object.entries(PROBLEM_TYPE_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleProblemType(key as ProblemType)}
                  className={`chip text-[11px] sm:text-xs py-1.5 sm:py-1 px-2.5 sm:px-2 transition-all active:scale-95 ${
                    filter.problemType === key
                      ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-3 sm:h-3" /> 客户等级
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Object.entries(CUSTOMER_LEVEL_LABEL)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleCustomerLevel(Number(key) as CustomerLevel)}
                    className={`chip text-[11px] sm:text-xs py-1.5 sm:py-1 px-2.5 sm:px-2 transition-all active:scale-95 ${
                      filter.customerLevel === Number(key)
                        ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/30'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 sm:w-3 sm:h-3" /> 优先级
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={toggleHighPriority}
                className={`chip text-[11px] sm:text-xs py-1.5 sm:py-1 px-2.5 sm:px-2 transition-all active:scale-95 ${
                  filter.isHighPriority === true
                    ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                ⭐ 高优
              </button>
              <button
                onClick={() =>
                  onChange({
                    ...filter,
                    isHighPriority:
                      filter.isHighPriority === false ? null : false,
                  })
                }
                className={`chip text-[11px] sm:text-xs py-1.5 sm:py-1 px-2.5 sm:px-2 transition-all active:scale-95 ${
                  filter.isHighPriority === false
                    ? 'bg-text-secondary/20 text-text-secondary border-text-secondary/30'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                普通
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
