<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const activeSection = ref('')

const navLinks = [
  { id: 'problem', label: 'Problem' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'critical-section', label: 'Critical Section' },
  { id: 'failure-lab', label: 'Failure Lab' },
  { id: 'evidence', label: 'Evidence' },
]

function onScroll() {
  scrolled.value = window.scrollY > 20

  // Find active section
  const sections = navLinks.map(l => document.getElementById(l.id)).filter(Boolean)
  let current = ''
  for (const sec of sections) {
    if (sec && sec.getBoundingClientRect().top <= 120) {
      current = sec.id
    }
  }
  activeSection.value = current
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav class="site-nav" :class="{ 'site-nav--scrolled': scrolled }" role="navigation" aria-label="Main navigation">
    <div class="site-nav__inner">
      <a href="#" class="site-nav__brand" aria-label="SALESTORM home">SALESTORM</a>
      <ul class="site-nav__links">
        <li v-for="link in navLinks" :key="link.id">
          <a
            class="site-nav__link"
            :class="{ 'site-nav__link--active': activeSection === link.id }"
            :href="'#' + link.id"
            @click.prevent="scrollTo(link.id)"
          >{{ link.label }}</a>
        </li>
      </ul>
      <span class="site-nav__team">CodeRed</span>
    </div>
  </nav>
</template>
