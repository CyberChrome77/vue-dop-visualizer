<template>
  <Navbar />
  <div class="container mt-4">
    <div class="row gx-4">
      <div class="col-md-3">
        <DatePicker @dateChanged="updateDate" />
      </div>

      <div class="col-md-9">
        <LeafletComp :selectedDate="selectedDate" />
      </div>
    </div>
  </div>

  <MainFooter />
</template>

<script setup>
import { ref } from "vue";
import LeafletComp from '@/components/LeafletComp.vue';
import Navbar from "@/components/MainNavbar.vue";
import DatePicker from './DatePicker.vue';
import MainFooter from './MainFooter.vue';

const roundDownToHour = (date) => {
  date.setMinutes(0, 0, 0);
  return date.toISOString().split(".")[0] + "Z";
};

const selectedDate = ref(roundDownToHour(new Date()));

const updateDate = (newDate) => {
  selectedDate.value = roundDownToHour(new Date(newDate));
};
</script>



<style scoped>
.container {
  max-width: 100%;
}
</style>