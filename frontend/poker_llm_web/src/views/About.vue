<template>
  <main class="about-page">
    <header class="about-hero">
      <span class="brand-signature">POSTSOMA-2050</span>
      <p class="eyebrow">{{ copy.eyebrow }}</p>
      <h1>{{ copy.title }}</h1>
      <p class="lede">{{ copy.lede }}</p>
      <RouterLink class="home-link" to="/">{{ copy.back }}</RouterLink>
    </header>

    <section aria-labelledby="mission-title" class="about-section featured-section">
      <p class="section-label">{{ copy.missionLabel }}</p>
      <h2 id="mission-title">{{ copy.missionTitle }}</h2>
      <p>{{ copy.missionBody }}</p>
      <ol class="five-question-list">
        <li v-for="step in copy.steps" :key="step.name">
          <strong>{{ step.name }}</strong>
          <span>{{ step.question }}</span>
        </li>
      </ol>
    </section>

    <section aria-labelledby="evidence-title" class="about-section">
      <p class="section-label">{{ copy.evidenceLabel }}</p>
      <h2 id="evidence-title">{{ copy.evidenceTitle }}</h2>
      <div class="evidence-grid">
        <article v-for="item in copy.evidence" :key="item.title">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
    </section>

    <section aria-labelledby="privacy-title" class="about-section">
      <p class="section-label">{{ copy.privacyLabel }}</p>
      <h2 id="privacy-title">{{ copy.privacyTitle }}</h2>
      <div class="plain-language-block">
        <p v-for="paragraph in copy.privacy" :key="paragraph">{{ paragraph }}</p>
      </div>
    </section>

    <section aria-labelledby="citation-title" class="about-section">
      <p class="section-label">{{ copy.citationLabel }}</p>
      <h2 id="citation-title">{{ copy.citationTitle }}</h2>
      <p>{{ copy.citationBody }}</p>
      <pre><code>{{ citationExample }}</code></pre>
      <div class="machine-links">
        <a href="/llms.txt">llms.txt</a>
        <a href="/llms-full.txt">llms-full.txt</a>
        <a href="/sitemap.xml">sitemap.xml</a>
        <a :href="SOURCE_REPOSITORY_URL" rel="noopener noreferrer">{{ copy.repository }}</a>
      </div>
    </section>

    <section aria-labelledby="limits-title" class="about-section limits-section">
      <p class="section-label">{{ copy.limitsLabel }}</p>
      <h2 id="limits-title">{{ copy.limitsTitle }}</h2>
      <ul>
        <li v-for="limit in copy.limits" :key="limit">{{ limit }}</li>
      </ul>
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/common/SiteFooter.vue'
import { isZh } from '@/i18n/locale.js'
import { HU_BTN_RFI_RANGE_ID, HU_BTN_RFI_RANGE_VERSION } from '@/training/ranges/hu-btn-rfi-100bb-v1.js'
import { POT_ODDS_DRILL_VERSION } from '@/training/drills/pot-odds-v1.js'
import { SITE_URL, SOURCE_REPOSITORY_URL } from '@/seo/siteMetadata.js'

const COPY = Object.freeze({
  en: Object.freeze({
    eyebrow: 'ABOUT · METHOD · EVIDENCE',
    title: 'Understand the method, evidence, and limits.',
    lede: 'POSTSOMA · ALLIN helps people ask better questions before a poker decision. It is not a solver, an authoritative strategy database, or a real-money poker service.',
    back: 'Back to the decision tool',
    missionLabel: 'MISSION',
    missionTitle: 'Understand the spot before searching for an answer.',
    missionBody: 'The product uses one repeatable sequence. Each question narrows what is known, assumed, and still uncertain before an action is chosen.',
    steps: Object.freeze([
      { name: 'Hand', question: 'What do I have?' },
      { name: 'Context', question: 'What spot am I in?' },
      { name: 'Range', question: 'What could we each have?' },
      { name: 'Price', question: 'What does this price require?' },
      { name: 'Risk', question: 'What could distort the decision?' }
    ]),
    evidenceLabel: 'EVIDENCE BOUNDARIES',
    evidenceTitle: 'Different claims use different evidence.',
    evidence: Object.freeze([
      { title: 'Mathematical facts', body: `The ${POT_ODDS_DRILL_VERSION} Price Builder uses fixed pot-odds formulas. Hero equity is a stated exercise assumption, not equity calculated from a Villain range.` },
      { title: 'Versioned range reference', body: `${HU_BTN_RFI_RANGE_ID} / ${HU_BTN_RFI_RANGE_VERSION} applies only to Heads-up · SB/Button · 100 BB · Unopened Pot · Open 2.5 BB. It is internally consistent but not solver-calibrated.` },
      { title: 'Free-play outcomes', body: 'Friend games, AI opinions, and one runout can help apply the five questions. They do not overwrite a math fact or become a verified training score.' }
    ]),
    privacyLabel: 'PRIVACY & DATA',
    privacyTitle: 'What stays local, and what leaves the browser.',
    privacy: Object.freeze([
      'Training answers, language preference, and selected lobby settings may be stored in browser localStorage or sessionStorage. There is currently no account database for these learning records.',
      'For BYOK free play, provider configuration—including an API key—can be saved in browser localStorage for convenience. Connection tests and AI games transmit the configured credential to the POSTSOMA backend and the selected provider. Clear site storage to remove cached browser credentials.',
      'Private room identifiers, player tokens, and live game state are operational data. They are not published in llms files, sitemaps, or public structured data.'
    ]),
    citationLabel: 'CITATION GUIDE',
    citationTitle: 'How to cite the project or a training reference.',
    citationBody: 'Include the product name, canonical URL, access date, and the exact range or drill version when discussing a fixed reference.',
    repository: 'Source repository',
    limitsLabel: 'SCOPE',
    limitsTitle: 'What this product does not claim.',
    limits: Object.freeze([
      'No complete GTO or solver coverage.',
      'No universal strategy answer across formats, stack depths, rake structures, or player counts.',
      'No real-money gambling, deposits, withdrawals, ranking, or matchmaking lobby.',
      'No claim that AI output, a friend’s opinion, or one hand result proves decision quality.'
    ])
  }),
  zh: Object.freeze({
    eyebrow: '关于 · 方法 · 证据',
    title: '了解方法、证据与边界。',
    lede: 'POSTSOMA · ALLIN 帮助用户在扑克决定前提出更好的问题。它不是 Solver、权威策略数据库或真钱扑克服务。',
    back: '返回决策工具',
    missionLabel: '使命',
    missionTitle: '先看懂局面，再寻找答案。',
    missionBody: '产品使用一套可重复的思考顺序。每个问题都帮助用户分开已知信息、题设假设与仍然存在的不确定性。',
    steps: Object.freeze([
      { name: 'Hand', question: '我拿到什么？' },
      { name: 'Context', question: '我处于什么局面？' },
      { name: 'Range', question: '我与对手可能有什么？' },
      { name: 'Price', question: '这个价格要求什么？' },
      { name: 'Risk', question: '哪些风险会让判断失真？' }
    ]),
    evidenceLabel: '证据边界',
    evidenceTitle: '不同结论，使用不同类型的依据。',
    evidence: Object.freeze([
      { title: '数学事实', body: `${POT_ODDS_DRILL_VERSION} Price Builder 使用固定底池赔率公式。Hero equity 是题设假设，不是系统根据对手范围计算出的真实 equity。` },
      { title: '版本化范围参考', body: `${HU_BTN_RFI_RANGE_ID} / ${HU_BTN_RFI_RANGE_VERSION} 只适用于 Heads-up · SB/Button · 100 BB · Unopened Pot · Open 2.5 BB。它在项目内部保持一致，但未经过 Solver 校准。` },
      { title: '自由对局结果', body: '朋友对局、AI 意见与一次 runout 可以帮助应用五问，但不能覆盖数学事实，也不会变成已验证的训练评分。' }
    ]),
    privacyLabel: '隐私与数据',
    privacyTitle: '哪些数据留在本地，哪些会离开浏览器。',
    privacy: Object.freeze([
      '训练答案、语言偏好和部分大厅设置可能保存在浏览器 localStorage 或 sessionStorage 中。目前没有用于这些学习记录的账户数据库。',
      '在 BYOK 自由对局中，包括 API Key 在内的 provider 配置可以为了方便而保存在浏览器 localStorage。连接测试和 AI 对局会把配置的凭证传给 POSTSOMA 后端与所选 provider。清除本站浏览器数据即可删除本地缓存凭证。',
      '私人房间 ID、玩家 token 和实时牌局状态属于运行数据，不会写入 llms 文件、sitemap 或公共结构化数据。'
    ]),
    citationLabel: '引用指南',
    citationTitle: '如何引用项目或固定训练参考。',
    citationBody: '引用时应包含产品名称、canonical URL、访问日期；讨论固定范围或题库时，还应包含准确版本号。',
    repository: '源代码仓库',
    limitsLabel: '适用范围',
    limitsTitle: '本产品不作出的承诺。',
    limits: Object.freeze([
      '不提供完整 GTO 或 Solver 覆盖。',
      '不提供跨赛制、筹码深度、rake、人数的通用策略答案。',
      '不提供真钱、充值、提现、排行榜或匹配大厅。',
      '不把 AI 输出、朋友意见或一次牌局结果当作决策质量证明。'
    ])
  })
})

const copy = computed(() => isZh.value ? COPY.zh : COPY.en)
const citationExample = computed(() => isZh.value
  ? `POSTSOMA · ALLIN（POSTSOMA-2050）。${SITE_URL}，访问日期：YYYY-MM-DD。范围参考：${HU_BTN_RFI_RANGE_ID} / ${HU_BTN_RFI_RANGE_VERSION}。`
  : `POSTSOMA · ALLIN (POSTSOMA-2050). ${SITE_URL} Accessed YYYY-MM-DD. Range reference: ${HU_BTN_RFI_RANGE_ID} / ${HU_BTN_RFI_RANGE_VERSION}.`)
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  padding: max(6.5rem, calc(env(safe-area-inset-top) + 5.5rem)) clamp(1rem, 4vw, 3rem) 2rem;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 50% 0%, rgba(15, 74, 50, 0.48), transparent 34rem),
    radial-gradient(circle at 92% 12%, rgba(212, 165, 74, 0.1), transparent 24rem),
    var(--bg-app);
}

.about-hero,
.about-section {
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
}

.about-hero {
  text-align: center;
}

.brand-signature,
.section-label,
.eyebrow {
  font-family: var(--font-family-mono);
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.brand-signature {
  color: #D4A54A;
  font-size: 0.7rem;
}

.eyebrow,
.section-label {
  margin-top: 0.7rem;
  color: var(--accent-primary);
  font-size: 0.68rem;
}

.about-hero h1 {
  max-width: 760px;
  margin: 0.8rem auto 0;
  font-size: clamp(2rem, 6vw, 4.4rem);
  line-height: 1.02;
}

.lede {
  max-width: 720px;
  margin: 1rem auto 0;
  color: var(--text-secondary);
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.7;
}

.home-link,
.machine-links a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-weight: 800;
  text-decoration: none;
}

.home-link {
  margin-top: 1rem;
  padding: 0 0.85rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
}

.home-link:hover,
.machine-links a:hover {
  color: var(--accent-primary-strong);
}

.home-link:focus-visible,
.machine-links a:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

.about-section {
  margin-top: clamp(2.5rem, 7vw, 5rem);
  padding: clamp(1.1rem, 3vw, 1.6rem);
  background: rgba(255, 255, 255, 0.024);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.featured-section {
  background: linear-gradient(145deg, rgba(31, 122, 79, 0.1), transparent 55%), rgba(255, 255, 255, 0.024);
}

.about-section h2 {
  margin-top: 0.45rem;
  font-size: clamp(1.3rem, 3vw, 1.9rem);
}

.about-section > p:not(.section-label),
.plain-language-block p,
.evidence-grid p,
.limits-section li {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.7;
}

.about-section > p:not(.section-label) {
  margin-top: 0.7rem;
}

.five-question-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 1.1rem;
  padding: 0;
  list-style: none;
}

.five-question-list li,
.evidence-grid article {
  min-width: 0;
  padding: 0.85rem;
  background: rgba(7, 5, 4, 0.38);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.five-question-list strong,
.five-question-list span {
  display: block;
}

.five-question-list strong {
  color: var(--accent-primary-strong);
  font-size: 0.92rem;
}

.five-question-list span {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.55;
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}

.evidence-grid h3 {
  color: var(--accent-primary-strong);
  font-size: 1rem;
}

.evidence-grid p {
  margin-top: 0.5rem;
}

.plain-language-block {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

pre {
  max-width: 100%;
  overflow-x: auto;
  margin-top: 0.9rem;
  padding: 0.9rem;
  color: var(--text-secondary);
  background: rgba(7, 5, 4, 0.58);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.machine-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.9rem;
  margin-top: 0.65rem;
}

.limits-section ul {
  display: grid;
  gap: 0.55rem;
  margin: 1rem 0 0;
  padding-left: 1.2rem;
}

@media (max-width: 800px) {
  .five-question-list,
  .evidence-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .about-page {
    padding-inline: 1rem;
  }

  .about-section {
    padding: 1rem;
  }
}
</style>
