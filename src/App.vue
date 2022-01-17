<template>
  <button @click="toggleModalState">Open modal</button>
  <hello-world>
    <p>Hello, I'm a modal window.</p>
  </hello-world>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
  export default {
    name: 'App',
    components: { HelloWorld },
  }
</script>


