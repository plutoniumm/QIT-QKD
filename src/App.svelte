<script>
	import DH from "./components/dh.svelte";
	import MANIM from "./components/ManIM.svelte";
	import BB84 from "./components/bbef.svelte";
	import BB84U from "./components/bbefu.svelte";
	import BB84UU from "./components/bbefuu.svelte";
	import PNS from "./components/pns.svelte";

	const activer = (e) => {
		return e.target.innerText == state ? "active" : "";
	};
	const handle = (e) => {
		state = cpts[e.target.innerText];
	};
	const cpts = {
		DH: DH,
		MANIM: MANIM,
		BB84_32: BB84,
		BB84_128: BB84U,
		BB84_512: BB84UU,
		PNS: PNS,
	};
	let state = cpts["PNS"];
</script>

<style type="text/scss">
	header {
		ul {
			display: flex;
			list-style: none;
			li {
				cursor: pointer;
				flex: 1;
				padding: 10px;
				text-align: center;
				transition: background 0.3s ease;
				&:hover {
					background: #dde;
				}
				.active {
					background: #ccd;
				}
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
		{#each Object.entries(cpts) as [Key, Value]}
			<li class={activer} on:click={handle}>{Key}</li>
		{/each}
	</ul>
</header>
<main>
	<svelte:component this={state} />
</main>
<footer><a href="https://me.nukes.in">A @plutonium project</a></footer>
