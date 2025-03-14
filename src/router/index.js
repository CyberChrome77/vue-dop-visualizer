import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/components/HomePage.vue";
// eslint-disable-next-line
import LeafletMap from "@/components/LeafletMap.vue";
import LeafletComp from "@/components/LeafletComp.vue";

const routes = [
  { path: "/", component: HomePage }, // Root path is homepage
  { path: "/map", component: LeafletComp }, // /map client-side endpoint for working visualization with database
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
