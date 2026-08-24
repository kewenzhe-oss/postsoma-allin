<template>
  <footer class="site-footer" aria-labelledby="site-footer-title">
    <div class="footer-identity">
      <strong id="site-footer-title">POSTSOMA-2050</strong>
      <p>{{ copy.boundary }}</p>
    </div>

    <nav :aria-label="copy.navLabel">
      <RouterLink to="/">{{ copy.home }}</RouterLink>
      <RouterLink to="/about">{{ copy.about }}</RouterLink>
      <a href="/llms.txt">llms.txt</a>
      <a href="/llms-full.txt">llms-full.txt</a>
      <a href="/sitemap.xml">Sitemap</a>
      <a :href="SOURCE_REPOSITORY_URL" rel="noopener noreferrer">{{ copy.source }}</a>
    </nav>

    <small>{{ copy.license }}</small>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { isZh } from '@/i18n/locale.js'
import { SOURCE_REPOSITORY_URL } from '@/seo/siteMetadata.js'

const copy = computed(() => isZh.value
  ? {
      boundary: '扑克决策思考工具。范围参考、数学事实与自由对局结果具有不同证据边界。',
      navLabel: '项目与机器索引链接',
      home: '首页',
      about: '方法与边界',
      source: '源代码',
      license: '项目代码采用 MIT License。引用产品内容时请保留名称、网址、版本与访问日期。'
    }
  : {
      boundary: 'A poker decision-thinking tool. Strategy references, math facts, and free-play outcomes have different evidence boundaries.',
      navLabel: 'Project and machine-index links',
      home: 'Home',
      about: 'Method & limits',
      source: 'Source code',
      license: 'Project code is available under the MIT License. Cite the product name, URL, version, and access date.'
    })
</script>

<style scoped>
.site-footer {
  width: 100%;
  max-width: 1040px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 0.8rem 1.5rem;
  margin: clamp(2.5rem, 7vw, 5rem) auto 1.5rem;
  padding: 1.1rem 1.2rem 1.35rem;
  color: var(--text-tertiary);
  background: rgba(255, 255, 255, 0.018);
  border-top: 1px solid var(--border-subtle);
}

.footer-identity strong {
  color: #9C7330;
  font-family: var(--font-family-mono);
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.14em;
}

.footer-identity p,
.site-footer small {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.7rem;
  line-height: 1.55;
}

.site-footer nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem 0.75rem;
}

.site-footer a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 750;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.site-footer a:hover {
  color: var(--accent-primary-strong);
  border-color: currentColor;
}

.site-footer a:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
  border-radius: 2px;
}

.site-footer small {
  grid-column: 1 / -1;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 700px) {
  .site-footer {
    grid-template-columns: 1fr;
    padding-inline: 0.25rem;
  }

  .site-footer nav {
    justify-content: flex-start;
  }

  .site-footer small {
    grid-column: auto;
  }
}
</style>
