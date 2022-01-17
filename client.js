import { createSSRApp } from "vue";
import App from "./App.vue";

// client-specific bootstrapping logic...

const app = createSSRApp(App);

// this assumes App.vue template root element has `id="app"`
//app.mount("#app");
