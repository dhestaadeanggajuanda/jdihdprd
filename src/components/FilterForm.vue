<template>
  <div class="filterform">
    <fieldset class="f">
      <legend class="lbl">Status</legend>
      <div class="opts">
        <label
          v-for="s in STATUS_OPTIONS"
          :key="s.value"
          class="opt"
          :class="{ on: draft.status === s.value }"
        >
          <input
            v-model="draft.status"
            class="opt-input"
            type="radio"
            :name="`${uid}-status`"
            :value="s.value"
          />
          <span class="rd" aria-hidden="true" />
          {{ s.label }}
        </label>
      </div>
      <div class="opts">
        <label class="opt" :class="{ on: draft.diubah }">
          <input v-model="draft.diubah" class="opt-input" type="checkbox" />
          <span class="cb" aria-hidden="true"><AppIcon name="check" /></span>
          Pernah diubah
        </label>
      </div>
    </fieldset>

    <div class="f">
      <label class="lbl" :for="`${uid}-jenis`">Jenis peraturan</label>
      <span class="field">
        <select :id="`${uid}-jenis`" v-model="draft.jenis">
          <option value="">Semua jenis</option>
          <option v-for="j in jenisOptions" :key="j.kode" :value="j.kode">{{
            j.nama
          }}</option>
        </select>
        <AppIcon name="chevron-down" size="sm" />
      </span>
    </div>

    <fieldset class="f">
      <legend class="lbl">Tahun penetapan</legend>
      <div class="two">
        <label class="field">
          <input
            v-model="draft.tahun_dari"
            inputmode="numeric"
            maxlength="4"
            placeholder="Dari"
            aria-label="Tahun dari"
            autocomplete="off"
          />
        </label>
        <label class="field">
          <input
            v-model="draft.tahun_sampai"
            inputmode="numeric"
            maxlength="4"
            placeholder="Sampai"
            aria-label="Tahun sampai"
            autocomplete="off"
          />
        </label>
      </div>
    </fieldset>

    <div class="f">
      <label class="lbl" :for="`${uid}-nomor`">Nomor</label>
      <span class="field">
        <input
          :id="`${uid}-nomor`"
          v-model="draft.nomor"
          inputmode="numeric"
          maxlength="20"
          placeholder="Contoh: 3"
          autocomplete="off"
        />
      </span>
    </div>

    <div class="f">
      <label class="lbl" :for="`${uid}-subyek`">Subjek</label>
      <span class="field">
        <input
          :id="`${uid}-subyek`"
          v-model="draft.subyek"
          maxlength="60"
          placeholder="Contoh: pajak, retribusi"
          autocomplete="off"
        />
      </span>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

// Draf filter dimiliki induk; komponen ini hanya menampilkan dan mengubahnya.
defineProps({
  draft: { type: Object, required: true },
  jenisOptions: { type: Array, default: () => [] },
  // Awalan id unik: panel (desktop) dan sheet (ponsel) bisa ada bersamaan di DOM.
  uid: { type: String, default: 'f' }
})

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'berlaku', label: 'Berlaku' },
  { value: 'dicabut', label: 'Dicabut' }
]
</script>
