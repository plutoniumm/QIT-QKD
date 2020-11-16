<script>
    let a, b, ai, bi, g, p;
</script>

<style type="text/scss">
    input {
        font-size: 1em;
    }
    section {
        display: flex;
        padding-top: 10px;
        article {
            text-align: center;
            width: calc(25% - 20px);
            padding: 10px;
            font-size: 1.33em;
            p {
                padding: 10px;
            }
        }
    }
</style>

<div
    style="display:flex;justify-content:space-around;font-size:1.33em;padding-top:10px;">
    <p>p: <input type="number" bind:value={p} /></p>
    <p>g: <input type="number" bind:value={g} /></p>
</div>
<section>
    <article style="background:#fee;border-radius:10px">
        <h1>Alice/User</h1>
        <p>a: <input type="number" bind:value={a} /></p>
        <p>&nbsp;</p>
        A = g^a mod p =
        {g ** a % p}
        <p>&nbsp;</p>
        K1 = B'^a mod p =
        {(g ** ai % p) ** a % p}
    </article>
    <article>
        <h1>Zuck to Alice</h1>
        <p>a': <input type="number" bind:value={ai} /></p>
        <p>&nbsp;</p>
        B' = g^a' mod p =
        {g ** ai % p}
        <p>&nbsp;</p>
        K1 = A^a' mod p =
        {(g ** a % p) ** ai % p}
    </article>
    <article>
        <h1>Zuck to Bob</h1>
        <p>b': <input type="number" bind:value={bi} /></p>
        <p>&nbsp;</p>
        A' = g^b' mod p =
        {g ** bi % p}
        <p>&nbsp;</p>
        K2 = B^b' mod p =
        {(g ** b % p) ** bi % p}
    </article>
    <article style="background:#efe;border-radius:10px">
        <h1>Bob/Server</h1>
        <p>b: <input type="number" bind:value={b} /></p>
        <p>&nbsp;</p>
        B = g^b mod p =
        {g ** b % p}
        <p>&nbsp;</p>
        K2 = A'^b mod p =
        {(g ** bi % p) ** b % p}
    </article>
</section>
