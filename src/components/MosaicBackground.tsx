import React from 'react';

/**
 * MosaicBackground Component
 * Displays a mosaic grid background with images in a 4-3-4-3-4 column pattern
 * Used across multiple pages (HomePage, LoginPage, RegisterPage, ForgotPasswordPage)
 */
export const MosaicBackground: React.FC = () => {
  // Mosaic background images from public folder
  const mosaicImages = [
    '/images/background/mosaic-1.jpg',
    '/images/background/mosaic-2.jpg',
    '/images/background/mosaic-3.jpg',
    '/images/background/mosaic-4.jpg',
    '/images/background/mosaic-5.jpg',
    '/images/background/mosaic-6.jpg',
    '/images/background/mosaic-7.jpg',
    '/images/background/mosaic-8.jpg',
    '/images/background/mosaic-9.jpg',
    '/images/background/mosaic-10.jpg',
    '/images/background/mosaic-11.jpg',
    '/images/background/mosaic-12.jpg',
    '/images/background/mosaic-13.jpg',
    '/images/background/mosaic-14.jpg',
    '/images/background/mosaic-15.jpg',
    '/images/background/mosaic-16.jpg',
    '/images/background/mosaic-17.jpg',
    '/images/background/mosaic-18.jpg',
  ];

  // Column pattern: 4-3-4-3-4
  const columnPattern = [4, 3, 4, 3, 4];
  
  // Distribute images across columns
  const columns = columnPattern.map((count, colIndex) => {
    const startIndex = columnPattern.slice(0, colIndex).reduce((sum, c) => sum + c, 0);
    return mosaicImages.slice(startIndex, startIndex + count);
  });

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
      {/* Container with flex-row and 12px gap */}
      <div className="flex flex-row items-center" style={{ gap: '12px' }}>
        {/* Column 1 - 4 images */}
        <div className="flex flex-col items-center" style={{ gap: '12px' }}>
          {columns[0].map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-sm" style={{ width: '300px', height: '300px', minWidth: '300px', minHeight: '300px' }}>
              <img src={img} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
            </div>
          ))}
        </div>
        
        {/* Column 2 - 3 images */}
        <div className="flex flex-col items-center" style={{ gap: '12px' }}>
          {columns[1].map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-sm" style={{ width: '300px', height: '300px', minWidth: '300px', minHeight: '300px' }}>
              <img src={img} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
            </div>
          ))}
        </div>
        
        {/* Column 3 - 4 images */}
        <div className="flex flex-col items-center" style={{ gap: '12px' }}>
          {columns[2].map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-sm" style={{ width: '300px', height: '300px', minWidth: '300px', minHeight: '300px' }}>
              <img src={img} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
            </div>
          ))}
        </div>
        
        {/* Column 4 - 3 images */}
        <div className="flex flex-col items-center" style={{ gap: '12px' }}>
          {columns[3].map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-sm" style={{ width: '300px', height: '300px', minWidth: '300px', minHeight: '300px' }}>
              <img src={img} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
            </div>
          ))}
        </div>
        
        {/* Column 5 - 4 images */}
        <div className="flex flex-col items-center" style={{ gap: '12px' }}>
          {columns[4].map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-sm" style={{ width: '300px', height: '300px', minWidth: '300px', minHeight: '300px' }}>
              <img src={img} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/60 to-black/70" />
    </div>
  );
};
