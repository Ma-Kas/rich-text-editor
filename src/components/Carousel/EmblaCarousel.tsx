import React from 'react';
import { EmblaOptionsType } from 'embla-carousel';
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from './EmblaCarouselArrowButtons';
import useEmblaCarousel from 'embla-carousel-react';
import {
  CarouselImage,
  CarouselType,
} from '../../pages/editor/nodes/CarouselContainerNode';
import { LazyImage } from '../../pages/editor/nodes/CarouselComponent';

type PropType = {
  carouselType: CarouselType;
  imagesInView: number | null | undefined;
  imageGap?: string | null | undefined;
  slides: CarouselImage[];
  options?: EmblaOptionsType;
};

type InlineStyleType = {
  container: {
    marginLeft?: string | undefined;
  };
  slide: {
    paddingLeft?: string | undefined;
  };
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { carouselType, imagesInView, imageGap, slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  // If user has overriden stylesheet with inline properties, set them here
  // to apply to component
  const setInlineStyleOverride = (): InlineStyleType => {
    const style: InlineStyleType = { container: {}, slide: {} };
    if (imageGap && carouselType === 'slider') {
      style.container.marginLeft = `-${imageGap}`;
      style.slide.paddingLeft = `-${imageGap}`;
    }
    return style;
  };

  const inlineStyle = setInlineStyleOverride();

  return (
    <>
      <div className='embla__viewport' ref={emblaRef}>
        <div className='embla__container' style={inlineStyle.container}>
          {slides.map((image) => {
            return (
              <div
                className='embla__slide'
                style={inlineStyle.container}
                key={image.id}
              >
                <LazyImage
                  className='carousel-image'
                  src={image.src}
                  altText={image.altText}
                  objectPosition={image.objectPosition}
                  aspectRatio={image.aspectRatio}
                  imagesInView={imagesInView}
                  imageGap={imageGap}
                />
              </div>
            );
          })}
        </div>
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </div>
    </>
  );
};

export default EmblaCarousel;
