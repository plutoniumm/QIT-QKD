<script>
    import { onMount } from "svelte";

    let keylen = 32;

    let aStr = [];
    let aBasis = [];
    let bBasis = [];
    let photons = [];
    let bStr = [];
    let baseCheck = [];
    let eveCheck = [];
    let final = [];

    const bin = () => (Math.random() >= 0.5 ? 1 : 0);
    const rand = (len) => new Array(len).fill(0).map(bin);

    function generate(keylen) {
        const photonCalc = (el, i) => {
            if (!el) return !aStr[i] ? "0" : "90";
            else return aStr[i] ? "45" : "-45";
        };
        const decoder = (el, i) => {
            if (bBasis[i] != aBasis[i]) return bin();
            if (!bBasis[i]) {
                if (el == "0") return 0;
                if (el == "90") return 1;
            } else {
                if (el == "-45") return 0;
                if (el == "45") return 1;
            }
        };
        aStr = rand(keylen);
        aBasis = rand(keylen);
        bBasis = rand(keylen);
        photons = aBasis.map(photonCalc);
        bStr = photons.map(decoder);
        baseCheck = bBasis.map((el, i) => (el == aBasis[i] ? 1 : 0));
        eveCheck = baseCheck.map((el, i) =>
            el && Math.round(Math.random()) ? aStr[i] : -1,
        );
        final = baseCheck.map((el, i) =>
            el && eveCheck[i] == -1 ? aStr[i] : -1,
        );
    }

    onMount(() => generate(keylen));
</script>

<section>
    <label>
        Key Length:
        <input
            type="number"
            bind:value={keylen}
            min="1"
            max="1024"
            step="1"
            on:keyup={() => generate(keylen)}
        />
    </label>

    <div class="rx10 m5 p5" style="background:#faf;">
        Alice's BitString
        <article>
            {#each aStr as aChar}
                <div class="balancer">{aChar}</div>
            {/each}
        </article>
        Alice's Bases
        <article>
            {#each aBasis as aBase}
                <svg class="balancer" viewBox="0 0 32 32">
                    <path
                        d={aBase
                            ? "M2 30 L30 2 M30 30 L2 2"
                            : "M16 2 L16 30 M2 16 L30 16"}
                    />
                </svg>
            {/each}
        </article>
        Photons Sent
        <article>
            {#each photons as photon}
                <svg
                    class="balancer"
                    viewBox="0 0 32 32"
                    style="transform:rotate({photon + 'deg'})"
                >
                    <path d="M2 16 L30 16" />
                </svg>
            {/each}
        </article>
    </div>
    <div class="rx10 p5 m5" style="background:#afa;">
        Bob's Bases
        <article>
            {#each bBasis as bBase}
                <svg class="balancer" viewBox="0 0 32 32">
                    <path
                        d={bBase
                            ? "M2 30 L30 2 M30 30 L2 2"
                            : "M16 2 L16 30 M2 16 L30 16"}
                    />
                </svg>
            {/each}
        </article>
        Bob's BitString
        <article>
            {#each bStr as bChar}
                <div class="balancer">{bChar}</div>
            {/each}
        </article>
        Basis Matching
        <article>
            {#each baseCheck as check}
                <div class="balancer">{check ? "Y" : ""}</div>
            {/each}
        </article>
    </div>
    <div style="background:#aaf;border-radius:10px;padding:5px;margin:5px 0;">
        The Key: Lenth =
        {baseCheck.filter((x) => x == 1).length}/{aStr.length}~
        {((baseCheck.filter((x) => x == 1).length / aStr.length) * 100).toFixed(
            2,
        )}%

        <article>
            {#each baseCheck as check, i}
                <div class="balancer">{check ? aStr[i] : ""}</div>
            {/each}
        </article>
        Eve Check
        <article>
            {#each eveCheck as check}
                <div class="balancer">{check == -1 ? "" : check}</div>
            {/each}
        </article>
        Final Key
        {final.filter((x) => x != -1).length}/{aStr.length}~
        {((final.filter((x) => x != -1).length / aStr.length) * 100).toFixed(
            2,
        )}%

        <article>
            {#each final as char}
                <div class="balancer">{char == -1 ? "" : char}</div>
            {/each}
        </article>
    </div>
</section>

<style lang="scss">
    svg {
        width: 18px;
        height: 18px;
        stroke: currentcolor;
        stroke-linejoin: round;
        stroke-linecap: round;
        stroke-width: 1px;
        fill: none;
    }
    section {
        padding: 4px;
        padding-top: 10px;
        article {
            display: flex;
            padding: 20px 10px;
            .balancer {
                text-align: center;
                flex: 1;
            }
        }
    }
</style>
