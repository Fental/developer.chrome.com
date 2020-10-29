const yaml = require('js-yaml');

// Markdown
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItAttrs = require('markdown-it-attrs');

// Filters
const {absolute, trailingSlash, leadingAndTrailingSlash} = require('./site/_filters/urls');
const {i18n} = require('./site/_filters/i18n');

// Shortcodes
const {img} = require('./site/_shortcodes/img');
const {video} = require('./site/_shortcodes/video');

// Transforms
const {prettyUrls} = require('./site/_transforms/pretty-urls');

// Plugins
const rssPlugin = require('@11ty/eleventy-plugin-rss');
const optimizeHtmlPlugin = require('./site/_plugins/optimize-html');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

// Supported locales
const locales = require('./site/_data/site').locales;

// Collections
const feedsCollection = require('./site/_collections/feeds');
const tagsCollection = require('./site/_collections/tags');
const typesCollection = require('./site/_collections/types');

// Create a helpful production flag
const isProduction = process.env.NODE_ENV === 'production';

module.exports = eleventyConfig => {
  // Tell 11ty to use the .eleventyignore and ignore our .gitignore file
  // We do this so we can have gulp put compiled css into our _includes/css
  // directory. We want to .gitignore this compiled css, but we want elventy
  // to use it for its build.
  eleventyConfig.setUseGitIgnore(false);

  // Merge eleventy's data cascade. This means directory data files will
  // cascade down to any child directories.
  eleventyConfig.setDataDeepMerge(true);

  // Copy binary assets over to the dist/ directory.
  // images should ideally be uploaded to our CDN but if, for whatever reason,
  // they can't be, then this passthrough copy will pick them up.
  eleventyConfig.addPassthroughCopy('site/en/**/*.{jpg,jpeg,png,webp}');

  // Make .yml files work in the _data directory.
  eleventyConfig.addDataExtension('yml', contents => yaml.safeLoad(contents));

  // Add markdown configuration
  const markdownItOptions = {
    html: true,
  };

  const markdownItAnchorOptions = {
    level: 2,
    permalink: true,
    permalinkClass: 'headline__link',
    permalinkSymbol: '#',
  };

  const markdownItAttrsOpts = {
    leftDelimiter: '{:',
    rightDelimiter: '}',
    allowedAttributes: ['id', 'class', /^data-.*$/],
  };

  const md = markdownIt(markdownItOptions)
    .use(markdownItAnchor, markdownItAnchorOptions)
    .use(markdownItAttrs, markdownItAttrsOpts);

  eleventyConfig.setLibrary('md', md);

  // Add plugins
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);
  // Only minify HTML and inline CSS if we are in production because it slows
  // builds _right_ down
  if (isProduction) {
    eleventyConfig.addPlugin(optimizeHtmlPlugin);
  }

  // Add collections
  locales.forEach(locale => eleventyConfig.addCollection(`blog-${locale}`, collections => {
    return collections.getFilteredByGlob(`./site/${locale}/blog/*/*.md`).reverse();
  }));
  eleventyConfig.addCollection('feeds', feedsCollection);
  eleventyConfig.addCollection('tags', tagsCollection);
  eleventyConfig.addCollection('types', typesCollection);

  // Add filters
  eleventyConfig.addFilter('absolute', absolute);
  eleventyConfig.addFilter('trailingSlash', trailingSlash);
  eleventyConfig.addFilter('leadingAndTrailingSlash', leadingAndTrailingSlash);
  eleventyConfig.addFilter('i18n', i18n);

  // Add shortcodes
  eleventyConfig.addShortcode('img', img);
  eleventyConfig.addShortcode('video', video);

  // Add transforms
  eleventyConfig.addTransform('prettyUrls', prettyUrls);

  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'site',
      output: 'dist',
    },
  };
};
