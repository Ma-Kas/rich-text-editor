import * as React from 'react';

const ImageComponent = React.lazy(() => import('../nodes/ImageComponent'));
const GalleryComponent = React.lazy(() => import('../nodes/GalleryComponent'));
const CarouselComponent = React.lazy(
  () => import('../nodes/CarouselComponent')
);
const StickyComponent = React.lazy(() => import('../nodes/StickyComponent'));

export { ImageComponent, GalleryComponent, CarouselComponent, StickyComponent };
