<script>
    let eve = true;
</script>

<div class="w-100 tc">
    <button
        on:click={() => (eve = !eve)}
        class="rx5 p5"
        style="font-size:2em;border:1px solid;"
    >
        Eve {eve ? "🙃 ON" : "🙂 OFF"}
    </button>
    <br />
    <svg
        viewBox="0 0 512 512"
        stroke-width="0"
        stroke="transparent"
        font-size="1.5em"
    >
        <rect x="50" y="300" height="50" width="400" rx="5" fill="#444" />
        <rect x="220" y="200" height="120" width="50" rx="5" fill="#444" />

        {#each Array(5) as __dirname, i}
            {#if eve}
                <circle
                    id="eve"
                    cx="60"
                    cy="320"
                    r="5"
                    style="animation-delay:{2 * i + 's'}"
                />
            {:else}
                <circle
                    id="photon1"
                    cx="60"
                    cy="320"
                    r="5"
                    style="animation-delay:{2 * i + 's'}"
                />
            {/if}
            <circle
                id="photon2"
                cx="50"
                cy="325"
                r="5"
                style="animation-delay:{2 * i + 's'}"
            />
            <circle
                id="photon3"
                cx="61"
                cy="332"
                r="5"
                style="animation-delay:{2 * i + 's'}"
            />
        {/each}

        <rect x="5" y="295" height="60" width="60" rx="5" fill="#faa" />
        <rect x="440" y="295" height="60" width="60" rx="5" fill="#afa" />
        <rect x="215" y="145" height="60" width="60" rx="5" fill="#aaf" />

        <!-- text boxes to put insise the squares of A, B and E -->
        <text x="27" y="335" fill="#fff"> A </text>
        <text x="462.5" y="335" fill="#fff"> B </text>
        <text x="237.5" y="185" fill="#fff"> E </text>
    </svg>
</div>

<style lang="scss">
    svg {
        width: 720px;
        margin: 0 25%;
        height: auto;
    }

    circle {
        fill: #fff;
        stroke: transparent;
    }

    rect {
        stroke: transparent;
    }

    #photon1,
    #photon2,
    #photon3 {
        animation: ltr 10s infinite linear;
    }
    #eve {
        animation: eve 8s infinite linear;
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
