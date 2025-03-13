<template>
    <Navbar />
    <div class="container mt-4">
    <div class="row gx-4">
      <div class="col-md-3">
        <DatePicker @dateChanged="updateDate" />
      </div>

      <div class="col-md-9">
        <LeafletMap :selectedDate="selectedDate" />
      </div>
    </div>
  </div>

  <MainFooter />
</template>

<script setup>

import LeafletMap from '@/components/LeafletMap.vue' //Change file name for comparison 
import Navbar from "@/components/MainNavbar.vue";
import DatePicker from './DatePicker.vue';
import MainFooter from './MainFooter.vue';

</script>


<style scoped>

.container {
  max-width: 100%;
}

</style>    