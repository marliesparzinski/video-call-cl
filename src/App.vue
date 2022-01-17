<template>
  <div id="app" className="container">
    <h1>Cloom Video Assignment</h1>
    <hello-world></hello-world>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
  export default {
    name: 'App',
    components: { HelloWorld },
  }
</script>

<style>  
  @font-face {
    font-family: 'Aeonik-Regular';
    src: local('Aeonik-Regular'), url('./assets/fonts/Aeonik-Regular.otf') format("truetype");
  }

  body {
    font-family: 'Aeonik-Regular', sans-serif;
    background-color: #e9f1ef;
    margin: 32px;
  }

  .container {
    border: 2px solid #f6d994;
    border-radius: 12px;
    padding: 32px 64px;

  }

  h1 {    
    font-size: 48px;
    margin: 16px;
    width: 100%;
    text-align: center;
  }
</style>

