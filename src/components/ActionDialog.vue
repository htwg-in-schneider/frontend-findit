<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    message: string
    acceptText?: string
    cancelText?: string
    variant?: 'primary' | 'danger'
    isLoading?: boolean
  }>(),
  {
    acceptText: 'Bestätigen',
    cancelText: 'Abbrechen',
    variant: 'primary',
    isLoading: false,
  },
)

const emit = defineEmits<{
  accept: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-backdrop" @click.self="emit('cancel')">
      <section class="dialog-card" role="dialog" aria-modal="true">
        <div class="dialog-icon" :class="variant">
          {{ variant === 'danger' ? '!' : '✓' }}
        </div>

        <div>
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="isLoading"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            class="dialog-accept"
            :class="variant"
            :disabled="isLoading"
            @click="emit('accept')"
          >
            {{ isLoading ? 'Bitte warten...' : acceptText }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(10px);
}

.dialog-card {
  width: min(460px, 100%);
  display: grid;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: white;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.32);
  animation: dialogIn 0.18s ease-out;
}

.dialog-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: white;
  font-size: 1.35rem;
  font-weight: 900;
}

.dialog-icon.primary {
  background: var(--primary);
}

.dialog-icon.danger {
  background: var(--danger);
}

.dialog-card h2 {
  margin: 0 0 8px;
  font-size: 1.45rem;
}

.dialog-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-accept {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  color: white;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.dialog-accept.primary {
  background: var(--primary);
}

.dialog-accept.danger {
  background: var(--danger);
}

.dialog-accept:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes dialogIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 520px) {
  .dialog-card {
    padding: 22px;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .dialog-actions button {
    width: 100%;
  }
}
</style>