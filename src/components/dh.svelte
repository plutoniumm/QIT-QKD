<script>
    let a = 0n,
        b = 0n,
        g = 1n,
        p = 2n;

    function pgab(P, G, A, B) {
        p = BigInt(P);
        g = BigInt(G);
        a = BigInt(A);
        b = BigInt(B);
    }

    // g should be a primitive root of p
    function isPrimitive(g, p) {
        if (g >= p) return false;

        const pow = g ** (p - 1n) % p;
        console.log(pow % p);

        return pow === 1n;
    }
</script>

<!-- checking for conditions on gpab -->
<article
    class="p0 m10 rx10"
    style="width: calc(100% - 20px);font-size:2em;background:#000;color:#fff;"
>
    {#if a >= p || b >= p}
        <div class="p10">Ensure a &lt; p and b &lt; p</div>
    {/if}
    {#if !isPrimitive(g, p)}
        <div class="p10">Ensure g is a primitive root of p</div>
    {/if}
</article>

<section class="f p10">
    <article style="background:#faa;border-radius:10px">
        <h1>Alice/User</h1>
        <p>a: <input type="number" bind:value={a} /></p>
        <p>&nbsp;</p>
        A = g<sup>a</sup> mod p =
        {g ** a % p}
        <p>&nbsp;</p>
        K = B<sup>a</sup> mod p =
        {(g ** b % p) ** a % p}
    </article>

    <article>
        <h1>Public Information</h1>
        <p>p: <input type="number" bind:value={p} /></p>
        <p>g: <input type="number" bind:value={g} /></p>
        <h2>Personal Keys</h2>
        <p>A = {g ** a % p}, B = {g ** b % p}</p>
        <h2>&lt;= Keys Exchanged =&gt;</h2>
    </article>

    <article style="background:#afa;border-radius:10px">
        <h1>Bob/Server</h1>
        <p>b: <input type="number" bind:value={b} /></p>
        <p>&nbsp;</p>
        B = g<sup>b</sup> mod p
        {g ** b % p}
        <p>&nbsp;</p>
        K = A<sup>b</sup> mod p =
        {(g ** a % p) ** b % p}
    </article>
</section>

<section>
    Try out the following values:
    <ul class="p5">
        <li class="p10 m5 rx10" on:click={() => pgab(23, 9, 3, 4)}>
            p = 23, g = 9, a = 3, b = 4
        </li>
        <li class="p10 m5 rx10" on:click={() => pgab(23, 5, 3, 4)}>
            p = 23, g = 5, a = 3, b = 4
        </li>
        <li class="p10 m5 rx10" on:click={() => pgab(23, 19, 11, 17)}>
            p = 23, g = 19, a = 11, b = 17
        </li>
    </ul>
</section>

<style lang="scss">
    article {
        text-align: center;
        width: 33.33%;
        padding: 10px;
        font-size: 2em;
        h2 {
            font-size: 1em;
        }
        p {
            padding: 10px;
        }
        input {
            font-size: 1em;
            background: #fff;
        }
    }
    ul {
        li {
            font-size: 18px;
            width: 300px;
            background: #aaf;
        }
    }
</style>
