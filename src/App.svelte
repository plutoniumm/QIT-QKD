<script>
	import DH from "./components/dh.svelte";
</script>

<style type="text/scss">
	header {
		ul {
			display: flex;
			list-style: none;
			li {
				flex: 1;
				padding: 10px;
				text-align: center;
			}
		}
	}
	footer {
		background: #ddd;
		padding: 10px;
		width: calc(100% - 20px);
		text-align: center;
		position: absolute;
		bottom: 0;
	}
</style>

<header>
	<ul>
		<li>Diffie Hellman</li>
		<li>Diffie Hellman</li>
		<li>Diffie Hellman</li>
		<li>Diffie Hellman</li>
		<li>Diffie Hellman</li>
	</ul>
</header>
<main>
	<DH />
</main>
<footer><a href="https://me.nukes.in">A @plutonium project</a></footer>
