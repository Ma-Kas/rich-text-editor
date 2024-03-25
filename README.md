# Rich Text Editor

A purpose-built rich text editor, tailored to the needs of writing blogs with a focus on travel blogs.

Built on top of the Lexical framework by Meta, with major rewrites of existing plugins, and new plugins.

## Features

- Block-based plugins to add different types of content to the editor state
- Text-based blocks (paragraph, heading, lists)
  - Block formatting options
  - Text formatting options
- Fully responsive image block, to embed a single image from an url or file upload
  - User-enabled image manipulation
  - Style override for image parameters, while retaining responsiveness
- Fully responsive image gallery block to embed a group of images
  - Different types of galleries
  - Style overrides for whole gallery, as well as individual images
- Fully responsive carousel block
  - Different types of carousels
  - Style overrides for whole carousel, as well as individual images
- Universal embed content block
  - Pre-configured embeds of content from YouTube, Twitter, Instagram, Google Maps
  - A best-effort type general embed option for non-preconfigured other sources

## Built With

- [Lexical](https://github.com/facebook/lexical) - The rich text editor framework used
- [Embla](https://github.com/davidjerleke/embla-carousel) - Great carousels for react

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details
