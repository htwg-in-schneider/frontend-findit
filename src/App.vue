<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="site-header">
      <div class="container nav-container">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">f</span>
          <span>findIT</span>
        </RouterLink>

        <nav class="main-nav">
          <RouterLink to="/">Startseite</RouterLink>
          <RouterLink to="/items">Einträge</RouterLink>
          <RouterLink to="/items/new" class="nav-button">Gegenstand melden</RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="container footer-content">
        <p>© 2026 findIT – Verlorene und gefundene Gegenstände auf dem Campus.</p>
      </div>
    </footer>
  </div>
</template>