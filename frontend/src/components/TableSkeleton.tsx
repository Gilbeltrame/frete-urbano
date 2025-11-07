import React from "react";

interface TableSkeletonProps {
	rows?: number;
	cols?: number;
	className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 8, cols = 10, className }) => {
	return (
		<div className={`rounded-md border animate-pulse ${className || ""}`}>
			<div className='h-10 bg-gray-100 dark:bg-gray-800 rounded-t-md' />
			{Array.from({ length: rows }).map((_, r) => (
				<div key={r} className='flex border-t'>
					{Array.from({ length: cols }).map((_, c) => (
						<div key={c} className='h-8 flex-1 bg-gray-50 dark:bg-gray-900/40' />
					))}
				</div>
			))}
		</div>
	);
};

export default TableSkeleton;
