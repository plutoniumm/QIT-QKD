<script>
    let eve = true;
</script>

<style type="text/scss">
    svg {
        width: 720px;
        margin: 0 25%;
        height: auto;
    }
    #photon1,
    #photon2,
    #photon3 {
        animation: ltr 10s infinite linear;
    }
    #eve {
        animation: eve 8.1s infinite linear;
    }
    @keyframes eve {
        0% {
            transform: translateX(0) translateY(0);
        }
        50% {
            transform: translateX(190px) translateY(0);
        }
        100% {
            transform: translateX(190px) translateY(-150px);
        }
    }
    @keyframes ltr {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(470px);
        }
    }
</style>

<button on:click={() => (eve = !eve)}>Toggel Eve</button>
<svg viewBox="0 0 512 512">
    <!-- BASE -->
    <rect x="50" y="300" height="50" width="400" rx="5" fill="#444" />
    <rect x="220" y="200" height="120" width="50" rx="5" fill="#444" />
    <!-- Particles -->
    {#each Array(5) as __dirname, i}
        {#if eve}
            <circle
                id="eve"
                cx="60"
                cy="320"
                r="5"
                fill="#fff"
                style="animation-delay:{2 * i + 's'}" />
        {:else}
            <circle
                id="photon1"
                cx="60"
                cy="320"
                r="5"
                fill="#fff"
                style="animation-delay:{2 * i + 's'}" />
        {/if}
        <circle
            id="photon2"
            cx="50"
            cy="325"
            r="5"
            fill="#fff"
            style="animation-delay:{2 * i + 's'}" />
        <circle
            id="photon3"
            cx="61"
            cy="332"
            r="5"
            fill="#fff"
            style="animation-delay:{2 * i + 's'}" />
    {/each}
    <rect x="5" y="295" height="60" width="60" rx="5" fill="#faa" />
    <rect x="440" y="295" height="60" width="60" rx="5" fill="#afa" />
    <rect x="215" y="145" height="60" width="60" rx="5" fill="#aaf" />
</svg>
