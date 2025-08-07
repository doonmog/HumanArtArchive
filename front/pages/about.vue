<template>
  <div>
    <Header />
    <main class="p-4 md:p-8">
      <div class="prose mx-auto max-w-4xl" v-html="renderedMarkdown"></div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
// Note: Using a relative path to import the markdown file from outside the `front` directory.
// The `?raw` query is essential to import the file content as a string.
import aboutContent from '~/assets/content/about.md?raw';

const renderedMarkdown = computed(() => {
  // The markdown file includes frontmatter (---...---) which is not meant for display.
  // This removes the frontmatter block before parsing the markdown.
  const contentWithoutFrontmatter = aboutContent.replace(/---[\s\S]*?---/, '').trim();
  return marked(contentWithoutFrontmatter);
});
</script>