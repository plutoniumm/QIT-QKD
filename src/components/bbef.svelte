<script>
    let keylen = 32;
    const photonCalc = (el, i) => {
        if (!el) {
            if (!aStr[i]) return "0";
            else return "90";
        } else {
            if (aStr[i]) return "45";
            else return "-45";
        }
    };
    const decoder = (el, i) => {
        if (bBasis[i] != aBasis[i]) return Math.random() >= 0.5 ? 1 : 0;
        if (!bBasis[i]) {
            if (el == "0") return 0;
            if (el == "90") return 1;
        } else {
            if (el == "-45") return 0;
            if (el == "45") return 1;
        }
    };
    let aStr = new Array(keylen)
        .fill(1)
        .map((x) => (Math.random() >= 0.5 ? 1 : 0));
    let aBasis = new Array(keylen)
        .fill(1)
        .map((x) => (Math.random() >= 0.5 ? 1 : 0));
    let bBasis = new Array(keylen)
        .fill(1)
        .map((x) => (Math.random() >= 0.5 ? 1 : 0));
    let photons = aBasis.map(photonCalc);
    let bStr = photons.map(decoder);
    let baseCheck = bBasis.map((el, i) => (el == aBasis[i] ? 1 : 0));
    let eveCheck = baseCheck.map((el, i) =>
        el && Math.round(Math.random()) ? aStr[i] : -1
    );
    let final = baseCheck.map((el, i) =>
        el && eveCheck[i] == -1 ? aStr[i] : -1
    );
</script>

<style type="text/scss">
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

<section>
    <div style="background:#faf;border-radius:10px;padding:5px;margin:5px 0;">
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
                        d={aBase ? 'M2 30 L30 2 M30 30 L2 2' : 'M16 2 L16 30 M2 16 L30 16'} />
                </svg>
            {/each}
        </article>
        Photons Sent
        <article>
            {#each photons as photon}
                <svg
                    class="balancer"
                    viewBox="0 0 32 32"
                    style="transform:rotate({photon + 'deg'})">
                    <path d="M2 16 L30 16" />
                </svg>
            {/each}
        </article>
    </div>
    <div style="background:#afa;border-radius:10px;padding:5px;margin:5px 0;">
        Bob's Bases
        <article>
            {#each bBasis as bBase}
                <svg class="balancer" viewBox="0 0 32 32">
                    <path
                        d={bBase ? 'M2 30 L30 2 M30 30 L2 2' : 'M16 2 L16 30 M2 16 L30 16'} />
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
                <div class="balancer">{check ? 'Y' : ''}</div>
            {/each}
        </article>
    </div>
    <div style="background:#aaf;border-radius:10px;padding:5px;margin:5px 0;">
        The Key: Lenth =
        {baseCheck.filter((x) => x == 1).length}/{aStr.length}~
        {((baseCheck.filter((x) => x == 1).length / aStr.length) * 100).toFixed(2)}%

        <article>
            {#each baseCheck as check, i}
                <div class="balancer">{check ? aStr[i] : ''}</div>
            {/each}
        </article>
        Eve Check
        <article>
            {#each eveCheck as check}
                <div class="balancer">{check == -1 ? '' : check}</div>
            {/each}
        </article>
        Final Key
        {final.filter((x) => x != -1).length}/{aStr.length}~
        {((final.filter((x) => x != -1).length / aStr.length) * 100).toFixed(2)}%

        <article>
            {#each final as char}
                <div class="balancer">{char == -1 ? '' : char}</div>
            {/each}
        </article>
    </div>
</section>
