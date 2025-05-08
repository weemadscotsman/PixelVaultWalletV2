import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // If there's only 1 page, don't render pagination
  if (totalPages <= 1) return null;

  // Function to create range array
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  // Generate page numbers to display
  const generatePagination = () => {
    // If total pages is 7 or less, show all pages
    if (totalPages <= 7) {
      return range(1, totalPages);
    }

    // Calculate sibling indexes
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Determine if ellipsis should be shown
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Always show first and last page
    if (shouldShowLeftDots && shouldShowRightDots) {
      // Show dots on both sides
      return [1, 'leftDots', ...range(leftSiblingIndex, rightSiblingIndex), 'rightDots', totalPages];
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      // Show dots only on left side
      return [1, 'leftDots', ...range(totalPages - 4, totalPages)];
    } else if (!shouldShowLeftDots && shouldShowRightDots) {
      // Show dots only on right side
      return [...range(1, 5), 'rightDots', totalPages];
    }

    // Default - shouldn't reach here if logic is correct
    return range(1, totalPages);
  };

  const paginationItems = generatePagination();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="border-blue-900/50 text-blue-300"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {paginationItems.map((item, index) => {
        if (item === 'leftDots' || item === 'rightDots') {
          return (
            <div key={`${item}-${index}`} className="flex items-center justify-center w-9 h-9">
              <MoreHorizontal className="h-4 w-4 text-blue-300/50" />
            </div>
          );
        }

        return (
          <Button
            key={`page-${item}`}
            variant={currentPage === item ? "default" : "outline"}
            size="icon"
            className={currentPage === item 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "border-blue-900/50 text-blue-300"}
            onClick={() => onPageChange(Number(item))}
          >
            {item}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        className="border-blue-900/50 text-blue-300"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}