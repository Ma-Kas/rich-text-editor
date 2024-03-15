import * as React from 'react';

const ImageComponent = React.lazy(() => import('../nodes/ImageComponent'));
const StickyComponent = React.lazy(() => import('../nodes/StickyComponent'));

export { ImageComponent, StickyComponent };
