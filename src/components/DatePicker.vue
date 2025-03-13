<template>
    <div class="card text-bg-dark text-center border-secondary custom-card">
        <h5 class="card-header">GPS DOP Map</h5>
        <div class="card-body">
            <h5 class="card-title">Select Date</h5>


            <VueDatePicker v-model="selectedDate" ref="datepicker" @update:modelValue="emitDateChange" />


            <p class="card-text mt-3">
                <strong>Selected Date (UTC):</strong> {{ formattedDateUTC }}
            </p>
            <p class="card-text">
                <strong>Selected Date (PST):</strong> {{ formattedDatePST }}
            </p>
            <p class="note">
          <strong>Note:</strong> Pacific Standard Time (PST) is UTC -8:00.  
            During Daylight Savings Time (PDT), it is UTC -7:00.
        </p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, defineEmits } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const selectedDate = ref(new Date()); // Default to latest date
const emit = defineEmits(["dateChanged"]);

// Compute Selected Date in UTC
const formattedDateUTC = computed(() =>
    selectedDate.value.toLocaleString("en-US", {
        timeZone: "UTC",
        dateStyle: "full",
        timeStyle: "short"
    })
);

// Compute Selected Date in PST
const formattedDatePST = computed(() =>
    selectedDate.value.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        dateStyle: "full",
        timeStyle: "short"
    })
);

const emitDateChange = () => {
    emit("dateChanged", selectedDate.value);
};
</script>

<style scoped>
.card {
    width: 100%;
    padding: 1rem;
    margin-top: 10px;
    margin-left: 3em;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
}

.card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
}

p.card-text {
    margin-top: 10px;
    font-size: 1rem;
}
</style>
