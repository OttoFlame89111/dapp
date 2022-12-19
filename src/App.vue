<template>
  <div>
    <!-- "connect" click event is registered -->
    <button v-if="!connected" @click="connect">Connect wallet</button>
    <button v-if="connected">Call contract</button>
    {{ contractResult }}
  </div>
</template>

<script>
export default {
  name: 'App',

  data() {
    return {
      connected: false,
      contractResult: '',
    }
  },

  methods: {

    connect: function () {
        // this connects to the wallet
      
      if (window.ethereum) { // first we check if metamask is installed
        window.ethereum.request({ method: 'eth_requestAccounts' })
          .then(() => {
            this.connected = true; // If users successfully connected their wallet
          });
      }
    }
  }
}
</script>