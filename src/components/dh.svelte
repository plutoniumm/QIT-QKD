<script>
    let a, b, g, p;
</script>

<style type="text/scss">
    section {
        display: flex;
        padding-top: 10px;
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
            }
        }
    }
</style>

<section>
    <article style="background:#fee;border-radius:10px">
        <h1>Alice/User</h1>
        <p>a: <input type="number" bind:value={a} /></p>
        <p>&nbsp;</p>
        A = g^a mod p =
        {g ** a % p}
        <p>&nbsp;</p>
        K = B^a mod p =
        {(g ** b % p) ** a % p}
    </article>
    <article>
        <h1>Public Information</h1>
        <p>p: <input type="number" bind:value={p} /></p>
        <p>g: <input type="number" bind:value={g} /></p>
        <h2>Personal Keys</h2>
        <p>A = {g ** a % p}, B = {g ** b % p}</p>
        <h2>Keys Exchanged</h2>
    </article>
    <article style="background:#efe;border-radius:10px">
        <h1>Bob/Server</h1>
        <p>b: <input type="number" bind:value={b} /></p>
        <p>&nbsp;</p>
        B = g^b mod p
        {g ** b % p}
        <p>&nbsp;</p>
        K = A^b mod p =
        {(g ** a % p) ** b % p}
    </article>
</section>
