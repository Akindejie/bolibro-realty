'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
}

const Breadcrumbs = ({ items, showHomeIcon = true }: BreadcrumbsProps) => {
  const pathname = usePathname();

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {showHomeIcon && (
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-primary-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </li>
        )}

        {items.map((item, index) => {
          // Check if this is the last (current) item
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={`${index}-${item.href}`}>
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {isLast ? (
                  <span
                    className="ml-1 text-sm font-medium text-primary-700"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="ml-1 text-sm text-gray-500 hover:text-primary-700"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
