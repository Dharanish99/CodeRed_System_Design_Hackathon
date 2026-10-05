<script setup lang="ts">
import SiteHeader from './components/navigation/SiteHeader.vue'
import HeroPressure from './components/sections/HeroPressure.vue'
import InvariantSection from './components/sections/InvariantSection.vue'
import ArchitectureStory from './components/sections/ArchitectureStory.vue'
import CriticalSection from './components/sections/CriticalSection.vue'
import PaymentUncertainty from './components/sections/PaymentUncertainty.vue'
import OrderRecovery from './components/sections/OrderRecovery.vue'
import JuryLab from './components/sections/JuryLab.vue'
import EvidenceSection from './components/sections/EvidenceSection.vue'
import TradeoffFooter from './components/sections/TradeoffFooter.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <HeroPressure />
    <div class="section-divider" />
    <InvariantSection />
    <div class="section-divider" />
    <ArchitectureStory />
    <div class="section-divider" />
    <CriticalSection />
    <div class="section-divider" />
    <PaymentUncertainty />
    <div class="section-divider" />
    <OrderRecovery />
    <div class="section-divider" />
    <JuryLab />
    <div class="section-divider" />
    <EvidenceSection />
    <div class="section-divider" />
    <TradeoffFooter />
  </main>
</template>

<style scoped>
main {
  padding-top: 56px; /* nav height */
}
</style>
