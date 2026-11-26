import React from 'react';
import SimulationsCatalogPage from './SimulationsCatalogPage';

/**
 * Unified entry point for Khám phá Ngữ văn 2D/3D.
 * Delegates directly to the upgraded 40-lesson Interactive Storytelling 2D/3D Catalog.
 */
export function LiteratureExplorePage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <SimulationsCatalogPage />
    </div>
  );
}

export default LiteratureExplorePage;
